const pool = require('../database/db');
const assert = require('node:assert');
const { ValidationError, NotFoundError } = require('../utils/error');

class Model {
  static table = null;
  static OPERATORS = Object.freeze({
    AND: 'AND',
    OR: 'OR',
  });


  constructor(attrs) {
    Object.assign(this, attrs);
  }

  static async query(sql, params = [], conn = pool) {
    const [rows] = await conn.query(sql, params);
    return rows;
  }

  static async paginateQuery(baseSql, params = [], { page, limit, offset } = {}) {
    if (!limit) {
      const rows = await this.query(baseSql, params);
      return { data: rows, pagination: null };
    }

    const countSql = `SELECT COUNT(*) AS count FROM (${baseSql}) AS subquery`;
    const [countRows] = await pool.query(countSql, params);
    const totalItems = countRows[0].count;

    const paginatedSql = `${baseSql} LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(paginatedSql, [...params, Number(limit), Number(offset || 0)]);

    return {
      data: rows,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      }
    };
  }

  static async find(id) {
    assert.notEqual(this.table, null,
      "Can't use 'find' method on a model with undefined table");

    const numericId = Number(id);
    if (!id || isNaN(numericId) || numericId <= 0) {
      throw new ValidationError('Invalid model query parameter', [
        { field: 'id', value: id, message: 'ID must be a positive integer' }
      ]);
    }

    const [rows] = await pool.query(
      `SELECT * FROM \`${this.table}\` WHERE id = ? LIMIT 1`, [numericId]
    );

    if (rows.length > 0) {
      return new this(rows[0]);
    }
    return null;
  }

  static async findOrFail(id) {
    const record = await this.find(id);
    if (!record) {
      throw new NotFoundError(`Record not found in ${this.table} with id ${id}.`);
    }
    return record;
  }

  static async findOneBy(conditions, operator = "AND") {
    assert.notEqual(this.table, null,
      "Can't use 'findOneBy' method on a model with undefined table");

    const normalizedOp = String(operator).toUpperCase();

    assert.ok(Model.OPERATORS[normalizedOp],
      `Invalid logical operator: '${operator}'. Expected one of: ${Object.keys(Model.
        OPERATORS).join(', ')}`);

    const keys = Object.keys(conditions);
    const values = Object.values(conditions);

    assert.notEqual(keys.length, 0, "Conditions object cannot be empty");

    const whereClause = keys
      .map(key => `\`${key}\` = ?`)
      .join(` ${normalizedOp} `);

    const [rows] = await pool.query(
      `SELECT * FROM \`${this.table}\` WHERE ${whereClause} LIMIT 1`,
      values
    );

    if (rows.length > 0) {
      return new this(rows[0]);
    }
    return null;
  }

  static async findAll({
    page,
    limit,
    offset,
    sortBy = 'id',
    order = 'ASC',
    where = {},
    search = {},
    select = ['*']
  } = {}) {
    assert.notEqual(this.table, null,
      "Can't use 'findAll' method on a model with undefined table");

    const clauses = [];
    const params = [];

    for (const [column, value] of Object.entries(where)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map(() => '?').join(', ');
          clauses.push(`\`${column}\` IN (${placeholders})`);
          params.push(...value);
        }
      } else {
        clauses.push(`\`${column}\` = ?`);
        params.push(value);
      }
    }

    const searchClauses = [];
    for (const [column, value] of Object.entries(search)) {
      if (value === undefined || value === null) {
        continue;
      }
      let pattern = `%${String(value)}%`;
      searchClauses.push(`\`${column}\` LIKE ?`);
      params.push(pattern);
    }
    if (searchClauses.length > 0) {
      clauses.push(`(${searchClauses.join(' OR ')})`);
    }

    const whereQuery = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const safeSelect = select.map(col => col === '*'
      ? '*' : `\`${col.trim()}\``).join(', ');
    const safeSort = sortBy.trim() ? sortBy.trim().split(' ')[0] : 'id';
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `SELECT ${safeSelect} FROM \`${this.table}\` ${whereQuery}
      ORDER BY \`${safeSort}\` ${safeOrder}`;
    const queryParams = [...params];

    let totalItems = 0;
    if (limit) {
      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS count FROM \`${this.table}\` ${whereQuery}`,
        params
      );
      totalItems = countRows[0].count;
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(Number(limit), Number(offset || 0));
    }

    const [rows] = await pool.query(query, queryParams);
    const instances = rows.map(row => new this(row));

    return {
      data: instances,
      pagination: limit ? {
        page: Number(page) || 1,
        limit: Number(limit),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      } : null
    };
  }

  async delete() {
    const tableName = this.constructor.table;
    assert.notEqual(tableName, null,
      "Can't use 'delete' method on a model with undefined table");

    const numericId = Number(this.id);
    if (!this.id || isNaN(numericId) || numericId <= 0) {
      throw new ValidationError('Invalid model query parameter', [
        { field: 'id', value: this.id, message: 'ID must be a positive integer' }
      ]);
    }

    const [result] = await pool.query(
      `DELETE FROM \`${tableName}\` WHERE id = ? LIMIT 1`, [numericId]
    );
    return result.affectedRows > 0;
  }

  async save(conn = pool) {
    const tableName = this.constructor.table;

    assert.notEqual(tableName, null,
      "Can't use 'save' method on a model with undefined table");

    if (this.id) {
      const numericId = Number(this.id);
      if (isNaN(numericId) || numericId <= 0) {
        throw new ValidationError('Invalid model query parameter', [
          { field: 'id', value: this.id, message: 'ID must be a positive integer' }
        ]);
      }

      const [rows] = await conn.query(
        `SELECT * FROM \`${tableName}\` WHERE id = ?`, [numericId]
      );

      if (rows.length === 0) {
        throw new NotFoundError(`Cannot update: Record with ID ${this.id} does not exist`);
      }

      const record = rows[0];
      let data = {};

      Object.entries(this)
        .filter(([key, value]) =>
          key !== 'id' &&
          key !== 'table' &&
          record[key] !== value)
        .forEach(([key, value]) => {
          data[key] = value;
        });

      if (Object.keys(data).length === 0) {
        return this;
      }

      await conn.query(
        `UPDATE \`${tableName}\` SET ? WHERE id = ?`, [data, numericId]
      );

      return this;
    } else {
      let data = Object.entries(this)
        .filter(([key, _]) => key !== 'id' && key !== 'table');

      const keys = data.map(([key, _]) => key);
      const values = data.map(([_, value]) => value);

      const placeholders = values.map(_ => '?').join(', ');
      const quotedKeys = keys.map(k => `\`${k}\``).join(', ');

      const [result] = await conn.query(
        `INSERT INTO \`${tableName}\` (${quotedKeys}) VALUES (${placeholders})`,
        values
      );

      this.id = result.insertId;
      return this;
    }
  }
}

module.exports = Model;
