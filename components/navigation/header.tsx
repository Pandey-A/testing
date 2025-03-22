"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-background shadow-sm"
          : "bg-background"
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <img src="/gdgico.svg" alt="GDG Logo" className="w-10 h-10" />
          </Link>

         
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/events" className="nav-link">Events</Link>
            <Link href="/blog" className="nav-link">Blogs</Link>
            <Link href="/team" className="nav-link">Team</Link>
            <Link href="/domains" className="nav-link">Domains</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4 font-thin">
            {/* <ThemeSwitcher /> */}
            {user ? (
              <Button onClick={handleSignOut} variant="outline" className="font-thin">
                Sign Out
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button asChild variant="outline" className="font-thin">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild className="font-thin">
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

  
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>


      {isOpen && (
        <div className="fixed inset-0 bg-black z-40 flex flex-col items-center p-6 space-y-6">
          <button
            className="absolute top-4 right-4 p-2"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
          <Link href="/" className="nav-link" onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="/events" className="nav-link" onClick={() => setIsOpen(false)}>Events</Link>
          <Link href="/blogs" className="nav-link" onClick={() => setIsOpen(false)}>Blogs</Link>
          <Link href="/team" className="nav-link" onClick={() => setIsOpen(false)}>Team</Link>
          <Link href="/domains" className="nav-link" onClick={() => setIsOpen(false)}>Domains</Link>
          <Link href="/contact" className="nav-link" onClick={() => setIsOpen(false)}>Contact</Link>
          {/* <ThemeSwitcher /> */}
          {user ? (
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}