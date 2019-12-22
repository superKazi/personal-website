 import './styles/style.scss';
 import '../node_modules/notyf/notyf.min.css';
 import { debounce } from 'mini-debounce';
 import { Workbox } from 'workbox-window';
 import { Notyf } from 'notyf';

 // for mobile spacing using vh
 let vh = window.innerHeight * 0.01;
 document.documentElement.style.setProperty('--vh', `${vh}px`);

 window.addEventListener('resize', debounce(() => {
   vh = window.innerHeight * 0.01;
   document.documentElement.style.setProperty('--vh', `${vh}px`);
 }, 300));

 // service worker code
 if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js');
  const notyf = new Notyf();

  wb.addEventListener('installed', event => {
    if (event.isUpdate) {
      notyf.success({
        message: 'Hiya! My website’s seen some changes since you last visited. Refresh to get the latest and greatest.',
        duration: 5000,
        icon: false,
        backgroundColor: 'black',
        ripple: true,
      })
    }
  });
  wb.register();
}