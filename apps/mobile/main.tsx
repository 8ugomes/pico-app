import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileApp } from './app';
import './styles.css';

const target = document.getElementById('root');
if (!target) throw new Error('O contêiner do aplicativo não foi encontrado.');

createRoot(target).render(<StrictMode><MobileApp /></StrictMode>);
