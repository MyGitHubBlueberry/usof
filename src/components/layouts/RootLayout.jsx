import { Outlet } from "react-router-dom"
import { Suspense } from "react"
import Header from "./Header"
import Footer from "./Footer"

export default function RootLayout() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
