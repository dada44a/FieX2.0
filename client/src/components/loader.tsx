import { useAuthRole } from "@/context/AuthContext";
import { Link } from "@tanstack/react-router";

export default function Loader({ children }: { children: React.ReactNode }) {
    const {role} = useAuthRole();
    if(!role || role === null || role === undefined){
        return <div>Loading...</div>
    }
    if(role !== "ADMIN"){
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <img src="/noadmin.png" alt=""  className="w-[400px] h-[450px]" />
                <Link className="btn btn-primary btn-lg btn-outline text-white" to="/">Go to Home</Link>
            </div>
        )
    }   
  return (
    <div>{children}</div>
  )
}
