import Header from './Header';
import Footer from './Footer';
import useResetScroll from '../hooks/useResetScroll';

const Layout = ({ children }) => {
  useResetScroll();

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-hidden min-h-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
