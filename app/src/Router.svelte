<script lang="ts">
  import type { SvelteComponent } from "svelte";
  import Class from "./pages/Class.svelte";
  import { path } from "./stores";
  import Planner from "./pages/Planner.svelte";

  /// e.g., set to /app so /home corresponds to example.com/app/home
  const PREFIX = "";

  type Component<Props> = typeof SvelteComponent<Props>;

  interface Options<Props, MatchGroups = Props> {
    component: Component<Props>;
    transform?: (gps: MatchGroups) => Props;
  }

  // TODO: remove any's (might need existential types)

  const routes: Record<string, Component<any> | Options<any>> = {
    "/class/(?<department>\\w+)/(?<number>[\\w\\d]+)": {
      component: Class,
      transform: ({ department, number }) => ({
        department: department.toUpperCase(),
        number: number.toUpperCase(),
      }),
    },
    "/planner": Planner,
  };

  function isOptions<P, MG = P>(
    component: Component<P> | Options<P, MG>
  ): component is Options<P, MG> {
    return Object.hasOwn(component, "component");
  }

  const compiled: [RegExp, Options<any>][] = Object.entries(routes).map(
    ([route, component]) => [
      new RegExp("^" + PREFIX + route + "$"),
      isOptions(component) ? component : { component },
    ]
  );

  export let defaultComponent: Component<any>;

  let currentComponent = defaultComponent;
  let props: Record<string, any> = {};

  path.subscribe((path) => {
    history.pushState({}, "", path);
    updateRoute(path);
  });

  window.onpopstate = () => {
    // updateRoute(window.location.pathname);
    path.set(window.location.pathname);
  };

  function updateRoute(path: string) {
    for (const [route, options] of compiled) {
      let match = path.match(route);
      if (match) {
        props = (options.transform ?? ((x) => x))(match.groups);
        currentComponent = options.component;
        return;
      }
    }
    props = {};
    currentComponent = defaultComponent;
  }

  updateRoute(window.location.pathname);
</script>

<svelte:component this={currentComponent} {...props} />
