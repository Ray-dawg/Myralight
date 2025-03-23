import React from "react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Menu } from "lucide-react";

interface NavbarProps {
  logo?: string;
  menuItems?: Array<{ label: string; href: string }>;
  onLogin?: () => void;
  onRegister?: () => void;
}

const Navbar = ({
  logo = "Myra",
  menuItems = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  onLogin = () => console.log("Login clicked"),
  onRegister = () => console.log("Register clicked"),
}: NavbarProps) => {
  return (
    <nav className="sticky top-0 w-full bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary">{logo}</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-600 hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={onLogin}>
              Login
            </Button>
            <Button onClick={onRegister}>Register</Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {menuItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-gray-600 hover:text-primary transition-colors py-2"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      onClick={onLogin}
                      className="w-full"
                    >
                      Login
                    </Button>
                    <Button onClick={onRegister} className="w-full">
                      Register
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
