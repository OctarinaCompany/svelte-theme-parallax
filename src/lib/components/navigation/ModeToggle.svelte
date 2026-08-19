<script lang="ts">
	import SunIcon from "@lucide/svelte/icons/sun";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Swap from "$lib/components/ui/swap/index.js";
	import { mode, toggleMode } from "mode-watcher";
</script>

<Swap.Root
	swapped={mode.current === "dark"}
	onSwappedChange={toggleMode}
	animation="rotate"
	aria-label="Toggle light/dark mode"
	class={buttonVariants({ variant: "ghost", size: "icon" })}
>
	<Swap.Off>
		<SunIcon class="size-4" />
	</Swap.Off>
	<Swap.On>
		<MoonIcon class="size-4" />
	</Swap.On>
</Swap.Root>
