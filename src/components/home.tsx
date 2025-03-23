import React from "react";
import Navbar from "./layout/Navbar";
import HeroSection from "./sections/HeroSection";
import FeatureGrid from "./sections/FeatureGrid";

interface HomeProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

const Home = ({
  onLogin = () => (window.location.href = "/login"),
  onRegister = () => (window.location.href = "/register"),
}: HomeProps) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogin={onLogin} onRegister={onRegister} />
      <main>
        <HeroSection onLogin={onLogin} onRegister={onRegister} />
        <FeatureGrid />
      </main>
    </div>
  );
};

export default Home;
