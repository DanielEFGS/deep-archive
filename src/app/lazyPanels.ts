import { lazy } from "react";

export const DetailPanel = lazy(() =>
  import("../components/DetailPanel").then(({ DetailPanel }) => ({ default: DetailPanel })),
);

export const InfoPanel = lazy(() =>
  import("../components/InfoPanel").then(({ InfoPanel }) => ({ default: InfoPanel })),
);

export const IndexPanel = lazy(() =>
  import("../components/IndexPanel").then(({ IndexPanel }) => ({ default: IndexPanel })),
);

export const TrailPanel = lazy(() =>
  import("../components/TrailPanel").then(({ TrailPanel }) => ({ default: TrailPanel })),
);

export const TrailMenu = lazy(() =>
  import("../components/TrailMenu").then(({ TrailMenu }) => ({ default: TrailMenu })),
);
