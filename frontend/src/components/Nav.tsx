import { logout } from '../api/auth'
import { Link } from './Protected'

export default function Nav(){
  return (
    <nav className="w-full flex items-center justify-between p-4 border-b">
      <div className="font-bold">QR Check-In</div>
      <div className="flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/events/new">Create Event</Link>
        <button onClick={()=>{logout(); location.href='/login'}} className="px-3 py-1 rounded bg-gray-100">Logout</button>
      </div>
    </nav>
  )
}
