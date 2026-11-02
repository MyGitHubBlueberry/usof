import { PostContext } from './PostContext'

export function PostProvider({ value, children }) {
  return <PostContext.Provider value={value}>{children}</PostContext.Provider>
}

export default PostProvider
