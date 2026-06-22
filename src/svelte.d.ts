declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component<any>;
  export default component;
}
declare module "./bundles.generated.js" {
  export const bundles: any;
}
