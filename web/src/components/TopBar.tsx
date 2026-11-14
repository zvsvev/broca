import { Link } from "react-router-dom";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { WalletButton } from "./WalletButton";
import { useHowItWorks } from "./HowItWorks";

export function TopBar() {
  const { open } = useHowItWorks();

  return (
    <header className="topbar">
      <Link className="logo" to="/" aria-label="Broca home">
        <Logo />
        <span>broca</span>
      </Link>
      <Button variant="quiet" size="sm" onClick={open} aria-label="How it works">
        ?
      </Button>
      <WalletButton />
    </header>
  );
}
