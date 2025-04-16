declare module 'react-typewriter-effect' {
  import { FC } from 'react';

  interface TypewriterProps {
    multiText: string[];
    multiTextDelay?: number;
    typeSpeed?: number;
    multiTextLoop?: boolean;
    cursorColor?: string;
  }

  const Typewriter: FC<TypewriterProps>;
  export default Typewriter;
}
