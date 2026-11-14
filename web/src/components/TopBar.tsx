import { Link } from "react-router-dom";
import lockup from "../assets/brand/lockup.svg";
import { Button } from "./Button";
import { useHowItWorks } from "./HowItWorks";

export function TopBar() {
  const { open } = useHowItWorks();

  return (
    <header className="topbar">
      <Link className="logo" to="/" aria-label="Broca home">
        <img src={lockup} height={26} alt="Broca" />
      </Link>
      <Button variant="quiet" size="sm" to="/manifesto">
        Manifesto
      </Button>
      <Button variant="quiet" size="sm" onClick={open} aria-label="How it works">
        ?
      </Button>
    </header>
  );
}
