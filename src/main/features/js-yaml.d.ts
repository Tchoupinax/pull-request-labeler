declare module "js-yaml" {
  function load(str: string): unknown;
  function dump(obj: unknown): string;
}
