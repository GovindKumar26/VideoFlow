import React from 'react'
import Logo from './Logo'
import NavLinks from './Navlinks'
import AudienceToggle from './AudienceToggle'
import SignInButton from './SignInButton'

function Navbar() {
  return (
    
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <NavLinks />
        </div>
        
        <div className="flex items-center gap-4">
          <AudienceToggle />

          <SignInButton />

        </div>
      </nav>
    
  )
}

export default Navbar