import { Loader } from "@plane/ui";

export function ProjectWorkItemTypesLoader() {
  return (
    <Loader className="space-y-4 md:w-2/3">
      <Loader.Item height="50px" />
      <Loader.Item height="50px" />
      <Loader.Item height="50px" />
      <Loader.Item height="50px" />
    </Loader>
  );
}
