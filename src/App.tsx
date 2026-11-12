import Hero from './components/Hero/Hero';
import Benefits from './components/Benefits/Benefits';
import LeadForm from './components/LeadForm/LeadForm';
import Footer from './components/Footer/Footer';

export default function App() {
  return (
    <>
      <main>
        <Hero />
        <Benefits />
        <LeadForm />
      </main>
      <Footer />
    </>
  );
}
