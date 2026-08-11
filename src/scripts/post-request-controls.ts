interface PostRequestControl {
  disabled: boolean;
}

interface BusyTarget {
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
}

export function isPostRequestBusy(
  target: Pick<BusyTarget, "getAttribute">,
): boolean {
  return target.getAttribute("aria-busy") === "true";
}

export async function runWithPostRequestControls<T>(
  controls: PostRequestControl[],
  busyTarget: BusyTarget,
  request: () => Promise<T>,
): Promise<T> {
  const states = [...new Set(controls)].map((control) => ({
    control,
    disabled: control.disabled,
  }));
  const previousBusy = busyTarget.getAttribute("aria-busy");

  for (const { control } of states) control.disabled = true;
  busyTarget.setAttribute("aria-busy", "true");

  try {
    return await request();
  } finally {
    for (const { control, disabled } of states) control.disabled = disabled;
    if (previousBusy === null) busyTarget.removeAttribute("aria-busy");
    else busyTarget.setAttribute("aria-busy", previousBusy);
  }
}
