import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiDollarSign, FiUsers, FiUser } from 'react-icons/fi'; 

const BottomNavbar = () => {
  const navLinks = [
    { to: "/dashboard", icon: FiHome, label: "Home", end: true },
    { to: "/user/investments", icon: FiTrendingUp, label: "Invest" },
    { to: "/user/wallet", icon: FiDollarSign, label: "Wallet" },
    { to: "/user/team", icon: FiUsers, label: "Team" },
  ];

  const linkClass = "flex flex-col items-center justify-center pt-1 pb-1 px-2 text-gray-500 hover:text-blue-600 transition-colors duration-200 w-full";
  const activeLinkClass = "text-blue-600 font-medium"; 

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-t-md z-40 flex justify-around items-center md:hidden">
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''}`}
        >
          <link.icon className="w-5 h-5 mb-1" />
          <span className="text-[10px] leading-tight">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavbar;