import type { Metadata, Viewport } from 'next';
import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/400-italic.css';
import '@fontsource/bodoni-moda/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './globals.css';
export const metadata:Metadata={title:'Last Stop — A mystery among friends',description:'Six passengers. One killer. An overnight train with nowhere to hide. A multiplayer murder mystery you play in your browser.',applicationName:'Last Stop',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'Last Stop'},icons:{icon:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#122722'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
