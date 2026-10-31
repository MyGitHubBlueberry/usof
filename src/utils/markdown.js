import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import CodeBlock from '../components/markdown/CodeBlock'

export const MARKDOWN_PLUGINS = [remarkGfm, remarkBreaks]
export const MARKDOWN_COMPONENTS = { pre: CodeBlock }
