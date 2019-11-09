 import './styles/style.scss';
 import { debounce } from 'mini-debounce';

 // for mobile spacing using vh
 let vh = window.innerHeight * 0.01;
 document.documentElement.style.setProperty('--vh', `${vh}px`);

 window.addEventListener('resize', debounce(() => {
   vh = window.innerHeight * 0.01;
   document.documentElement.style.setProperty('--vh', `${vh}px`);
 }, 300));
