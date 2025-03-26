import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Menu, Truck, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface NavbarProps {
  logo?: string;
  menuItems?: Array<{
    label: string;
    href: string;
    submenu?: Array<{ label: string; href: string }>;
  }>;
  onLogin?: () => void;
  onRegister?: () => void;
}

const Navbar = ({
  logo = "MYRA",
  menuItems = [
    {
      label: "Solutions",
      href: "#solutions",
      submenu: [
        { label: "For Shippers", href: "#shippers" },
        { label: "For Carriers", href: "#carriers" },
        { label: "For Drivers", href: "#drivers" },
      ],
    },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    {
      label: "Resources",
      href: "#resources",
      submenu: [
        { label: "Case Studies", href: "#case-studies" },
        { label: "Documentation", href: "#documentation" },
        { label: "API", href: "#api" },
      ],
    },
    { label: "Contact", href: "#contact" },
  ],
  onLogin = () => console.log("Login clicked"),
  onRegister = () => console.log("Register clicked"),
}: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSubmenu = (label: string) => {
    setActiveSubmenu(activeSubmenu === label ? null : label);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Truck className="h-8 w-8 text-blue-600 mr-2" />
            <h1
              className={`text-2xl font-bold ${scrolled ? "text-blue-600" : "text-white"} tracking-tight`}
            >
              {logo}
            </h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <div key={item.label} className="relative group">
                <button
                  onClick={() => item.submenu && toggleSubmenu(item.label)}
                  className={`flex items-center ${scrolled ? "text-gray-700" : "text-white"} hover:text-blue-500 transition-colors py-2`}
                >
                  {item.label}
                  {item.submenu && (
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${activeSubmenu === item.label ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {item.submenu && (
                  <div
                    className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 ${activeSubmenu === item.label ? "opacity-100 visible" : "opacity-0 invisible"}`}
                  >
                    <div className="py-1">
                      {item.submenu.map((subitem) => (
                        <a
                          key={subitem.label}
                          href={subitem.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {subitem.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onLogin}
              className={`${scrolled ? "text-gray-700 hover:text-blue-600" : "text-white hover:text-blue-200"}`}
            >
              Login
            </Button>
            <Button
              onClick={onRegister}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={scrolled ? "text-gray-700" : "text-white"}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex items-center mt-4 mb-8">
                  <Truck className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-bold text-blue-600">{logo}</h2>
                </div>
                <div className="flex flex-col space-y-1">
                  {menuItems.map((item) => (
                    <div key={item.label} className="py-1">
                      <button
                        onClick={() =>
                          item.submenu && toggleSubmenu(item.label)
                        }
                        className="flex items-center justify-between w-full text-gray-700 hover:text-blue-600 transition-colors py-2"
                      >
                        {item.label}
                        {item.submenu && (
                          <ChevronDown
                            className={`ml-1 h-4 w-4 transition-transform ${activeSubmenu === item.label ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {item.submenu && activeSubmenu === item.label && (
                        <div className="ml-4 mt-1 border-l-2 border-blue-100 pl-4">
                          {item.submenu.map((subitem) => (
                            <a
                              key={subitem.label}
                              href={subitem.href}
                              className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                            >
                              {subitem.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-col space-y-4 pt-4 mt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      onClick={onLogin}
                      className="w-full justify-start text-gray-700 hover:text-blue-600"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={onRegister}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Get Started
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
