import logo from "@/assets/onebs-logo.png";

export const Logo = ({ className = "h-9" }: { className?: string }) => (
  <img src={logo} alt="OneBS - Đối tác đổi mới của bạn" className={className + " w-auto object-contain"} />
);
