const DbUser = require("../models/user-model");
const DbUserBan = require("../models/user-ban-model");
const { NotFoundError, BadRequestError, ForbiddenError } = require("../utils/error");
const { hashPassword } = require("../utils/password");
const { ROLES, ROLE_LEVELS, ERROR_MESSAGES } = require("../utils/constants");
const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const logger = require("../utils/logger");
const sendMail = require("../utils/email");
const { devLinkPayload } = require("../utils/dev-link");

module.exports = class UserController {
  static async getAvatar(req, res) {
    const { user_id } = req.params;
    const user = await DbUser.find(user_id);

    if (!user || !user.profile_picture_path) {
      throw new NotFoundError("Avatar not found.");
    }

    const filepath = path.join(__dirname, '../../uploads/avatars', user.profile_picture_path);
    res.sendFile(filepath, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: "Avatar not found." });
      }
    });
  }

  static async updateAvatar(req, res) {
    if (!req.file) {
      throw new BadRequestError("Avatar file is required in the 'avatar' field.");
    }
    const user = await DbUser.findOrFail(req.user.id);
    if (user.profile_picture_path) {
      const oldPath = path.join(__dirname, '../../uploads/avatars', user.profile_picture_path);
      await fs.rm(oldPath, { force: true }).catch(() => { });
    }
    user.profile_picture_path = req.file.filename;
    await user.save();
    return res.json({ message: "Avatar uploaded successfully." });
  }

  static async deleteAvatar(req, res) {
    const user = await DbUser.findOrFail(req.user.id);
    if (!user.profile_picture_path) {
      throw new BadRequestError("User doesn't have an avatar.");
    }
    const filepath = path.join(__dirname, '../../uploads/avatars', user.profile_picture_path);
    await fs.rm(filepath, { force: true }).catch(() => { });
    user.profile_picture_path = null;
    await user.save();
    return res.json({ message: "Avatar removed successfully." });
  }

  static async getAll(req, res) {
    const { page, limit, offset } = req.pagination;
    const { sortBy, order, search, role, status } = req.query;

    const where = {};
    if (role) {
      where.role = role;
    }

    const searchFilter = {};
    if (search) {
      searchFilter.login = search;
      searchFilter.email = search;
    }

    const result = await DbUser.findAll({
      page,
      limit,
      offset,
      sortBy,
      order,
      where,
      select: ["id", "login", "full_name",
        "email", "profile_picture_path", "rating",
        "role", "is_email_confirmed"],
      search: searchFilter
    });

    if (Array.isArray(result.data)) {
      result.data = await Promise.all(result.data.map(async (u) => {
        const activeBan = await DbUserBan.findActiveBan(u.id);
        return { ...u, is_banned: !!activeBan, active_ban: activeBan };
      }));

      if (status === 'banned') {
        result.data = result.data.filter((u) => u.is_banned);
        if (result.pagination) {
          result.pagination.totalItems = result.data.length;
          result.pagination.totalPages = Math.ceil(result.data.length / limit);
        }
      } else if (status === 'active') {
        result.data = result.data.filter((u) => !u.is_banned);
        if (result.pagination) {
          result.pagination.totalItems = result.data.length;
          result.pagination.totalPages = Math.ceil(result.data.length / limit);
        }
      }
    }

    return res.json(result);
  }

  static async search(req, res) {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const users = await DbUser.searchByLogin(q, limit);
    return res.json(users);
  }

  static async get(req, res) {
    const { user_id: id } = req.params;

    const user = await DbUser.find(id);

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return res.json(user.getPublicFields());
  }

  static async create(req, res) {
    const { login, email, password, full_name, role } = req.body;
    const hashed = await hashPassword(password);

    const user = new DbUser({
      login,
      email,
      password: hashed,
      full_name,
      role: role || ROLES.USER,
      is_email_confirmed: true
    });

    await user.save();
    return res.status(201).json(user.getPublicFields());
  }

  static async update(req, res) {
    const id = req.params.user_id;

    const user = await DbUser.find(id);

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!req.isAdmin && Number(req.user.id) !== Number(user.id)) {
      throw new ForbiddenError("Only the profile owner or an admin can update this profile.");
    }

    const { login, email, password, full_name } = req.body;

    user.login = login === undefined ? user.login : login;

    const emailChanged = email !== undefined && email !== user.email;
    if (emailChanged) {
      user.email = email;
      user.is_email_confirmed = false;
      user.email_verification_token = crypto.randomBytes(32).toString('hex');
    }

    if (password !== undefined && String(password).trim() !== '') {
      user.password = await hashPassword(password);
    }

    user.full_name = full_name === undefined ? user.full_name : full_name;

    await user.save();

    if (emailChanged) {
      sendMail(user.email, user.email_verification_token, 'Verify').catch(err =>
        logger.error(err, 'Failed to send verification email')
      );
    }

    return res.json({
      message: "User updated successfully.",
      user: user.getPublicFields(),
      ...(emailChanged ? devLinkPayload(`/confirm-email/${user.email_verification_token}`) : {})
    });
  }

  static async updateRole(req, res) {
    const id = req.params.user_id;
    const { role } = req.body;

    const user = await DbUser.findOrFail(id);

    if (Number(req.user.id) === Number(user.id)) {
      throw new ForbiddenError("You cannot modify your own role.");
    }

    user.role = role;
    await user.save();

    logger.info({ action: 'update_role', targetUserId: user.id, issuerId: req.user.id, newRole: role }, `Admin changed role of user '${user.login}' to '${role}'`);

    return res.json({
      message: `User '${user.login}' role updated to '${role}'.`,
      user: user.getPublicFields()
    });
  }

  static async toggleBan(req, res) {
    const id = req.params.user_id;
    const { ban, reason, expires_at } = req.body;

    const user = await DbUser.findOrFail(id);

    if (Number(req.user.id) === Number(user.id)) {
      throw new ForbiddenError("You cannot ban or unban your own account.");
    }

    const issuerLevel = ROLE_LEVELS[req.user.role] ?? 0;
    const targetLevel = ROLE_LEVELS[user.role] ?? 0;

    if (issuerLevel <= targetLevel) {
      throw new ForbiddenError("You cannot modify the ban status of an account" +
        " with equal or higher authority.");
    }

    if (ban) {
      const banReason = reason ? String(reason).trim() : null;
      const banRecord = await DbUserBan.banUser({
        userId: user.id,
        bannedBy: req.user.id,
        expiresAt: expires_at || null,
        reason: banReason
      });

      logger.info({ action: 'ban_user', targetUserId: user.id, issuerId: req.user.id, reason: banReason }, `Admin banned user '${user.login}'`);

      return res.json({
        message: `User '${user.login}' has been banned successfully.`,
        ban: banRecord
      });
    } else {
      await DbUserBan.unbanUser(user.id);
      logger.info({ action: 'unban_user', targetUserId: user.id, issuerId: req.user.id }, `Admin unbanned user '${user.login}'`);
      return res.json({
        message: `User '${user.login}' has been unbanned successfully.`
      });
    }
  }

  static async getBanHistory(req, res) {
    const id = req.params.user_id;
    await DbUser.findOrFail(id);

    const history = await DbUserBan.getBanHistory(id);
    return res.json(history);
  }

  static async getAllBanLogs(req, res) {
    const { page, limit } = req.pagination;
    const { search, status, targetUser, bannedBy, sortBy, order, dateFrom, dateTo } = req.query;

    const result = await DbUserBan.getAllBanHistory({
      page,
      limit,
      search,
      status,
      targetUser,
      bannedBy,
      sortBy,
      order,
      dateFrom,
      dateTo,
    });
    return res.json(result);
  }

  static async delete(req, res) {
    const id = req.params.user_id ?? req.user.id;

    const user = await DbUser.find(id);

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await user.delete();

    return res.status(204).end();
  }
};
