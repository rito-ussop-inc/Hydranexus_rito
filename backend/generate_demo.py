"""Generate demo CSV telemetry (PRD Phase 1)."""
import argparse
import pandas as pd
from app.simulator import generate_telemetry


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenario", default="leak")
    ap.add_argument("--points", type=int, default=24)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default="demo_telemetry.csv")
    args = ap.parse_args()
    rows = generate_telemetry(scenario=args.scenario, points=args.points, seed=args.seed)
    pd.DataFrame(rows).to_csv(args.out, index=False)
    print(f"Wrote {len(rows)} rows ({args.scenario}) -> {args.out}")


if __name__ == "__main__":
    main()
