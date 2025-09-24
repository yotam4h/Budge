import { useState } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';

type UserMenuProps = {
  username: string;
  email: string;
  onLogout: () => void;
};

export default function UserMenu({ username, email, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const initials = username
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="p-2">
          <p className="text-sm font-medium">{username}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={() => window.location.href = '/app/profile'}
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer" 
          onClick={() => window.location.href = '/app/settings'}
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer text-red-500 focus:text-red-500" 
          onClick={onLogout}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}