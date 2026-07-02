import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Combobox } from ".";
import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { useCombobox } from "./use-combobox";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
];

const meta = {
  title: "Inputs/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Combobox is a compound component that wires a trigger target to a floating dropdown of selectable options. Compose `Combobox.Target` + `Combobox.Dropdown` > `Combobox.Options` > `Combobox.Option`. Use `useCombobox` to obtain a store for controlled open/close state. Groups, empty states, headers, footers, and a clear button are all first-class sub-components.",
      },
    },
  },
  args: {
    size: "sm",
    position: "bottom",
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls size shared to dropdown parts.",
    },
    position: {
      control: "select",
      options: [
        "bottom",
        "top",
        "left",
        "right",
        "bottom-start",
        "bottom-end",
        "top-start",
        "top-end",
      ],
      description: "Dropdown placement relative to the target.",
    },
    disabled: { control: "boolean", description: "Skip rendering the dropdown." },
    readOnly: { control: "boolean", description: "Dropdown opens but options are presentational." },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    onOptionSubmit: { control: false },
    store: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Combobox>>;

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

/** A minimal inline text input used as a combobox target in stories. */
function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: "6px 10px",
        fontSize: 14,
        width: 200,
        outline: "none",
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Stories                                                                     */
/* -------------------------------------------------------------------------- */

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [search, setSearch] = React.useState("");
    const [selected, setSelected] = React.useState<string | null>(null);
    const store = useCombobox({ defaultOpened: false });

    const filtered = FRUITS.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (value: string) => {
      const match = FRUITS.find((f) => f.value === value);
      setSelected(match?.label ?? value);
      setSearch(match?.label ?? value);
      store.closeDropdown();
    };

    return (
      <Box gap="$sm">
        <Combobox {...args} store={store} onOptionSubmit={handleSubmit}>
          <Combobox.Target>
            <SearchInput
              placeholder="Search fruit…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                store.openDropdown();
              }}
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown>
            <Combobox.Options>
              {filtered.length > 0 ? (
                filtered.map((f) => (
                  <Combobox.Option key={f.value} value={f.value} selected={f.label === selected}>
                    {f.label}
                  </Combobox.Option>
                ))
              ) : (
                <Combobox.Empty>Nothing found</Combobox.Empty>
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {selected ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Demonstrates the five size tokens on the dropdown font and spacing. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="flex-start">
      {SIZES.map((size) => {
        const store = useCombobox({ defaultOpened: true });
        return (
          <Box key={size} gap="$xs" alignItems="center">
            <Text fontSize="$xs" color="$color11">
              {size}
            </Text>
            <Combobox {...args} size={size} store={store}>
              <Combobox.Target>
                <SearchInput
                  placeholder={size}
                  onFocus={() => store.openDropdown()}
                  onBlur={() => store.closeDropdown()}
                />
              </Combobox.Target>
              <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
                <Combobox.Options>
                  <Combobox.Option value="apple">Apple</Combobox.Option>
                  <Combobox.Option value="banana">Banana</Combobox.Option>
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </Box>
        );
      })}
    </Box>
  ),
};

/**
 * The `shadow` prop lifts the dropdown off the page using the shared elevation
 * ladder (`xs` → `xl`). Each combobox below is always open and rendered inline
 * (`withinPortal={false}`) inside its own relative wrapper so the dropdowns sit
 * side by side without overlapping.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => {
        const store = useCombobox({ defaultOpened: true });
        return (
          <Box key={shadow} gap="$xs" alignItems="center" position="relative" width={200}>
            <Text fontSize="$xs" color="$color11">
              {shadow}
            </Text>
            <Combobox {...args} shadow={shadow} store={store} withinPortal={false}>
              <Combobox.Target>
                <SearchInput placeholder={shadow} readOnly />
              </Combobox.Target>
              <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
                <Combobox.Options>
                  <Combobox.Option value="apple">Apple</Combobox.Option>
                  <Combobox.Option value="banana">Banana</Combobox.Option>
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </Box>
        );
      })}
    </Box>
  ),
};

/** Controlled selection — the selected value and the search query are owned by the parent. */
export const Controlled: Story = {
  render: (args) => {
    const [search, setSearch] = React.useState("");
    const [selected, setSelected] = React.useState<string | null>(null);
    const store = useCombobox({ defaultOpened: false });

    const filtered = FRUITS.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()));

    const handleSubmit = (value: string) => {
      const match = FRUITS.find((f) => f.value === value);
      setSelected(match?.label ?? value);
      setSearch(match?.label ?? value);
      store.closeDropdown();
    };

    return (
      <Box gap="$sm">
        <Combobox {...args} store={store} onOptionSubmit={handleSubmit}>
          <Combobox.Target>
            <SearchInput
              placeholder="Search fruit…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                store.openDropdown();
              }}
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
            <Combobox.Options>
              {filtered.length > 0 ? (
                filtered.map((f) => (
                  <Combobox.Option key={f.value} value={f.value} selected={f.label === selected}>
                    {f.label}
                  </Combobox.Option>
                ))
              ) : (
                <Combobox.Empty>Nothing found</Combobox.Empty>
              )}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {selected ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Grouped options with labelled sections. */
export const Grouped: Story = {
  args: {
    size: "md",
  },

  render: (args) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const store = useCombobox({ defaultOpened: true });

    const handleSubmit = (value: string) => {
      setSelected(value);
      store.closeDropdown();
    };

    return (
      <Box gap="$sm">
        <Combobox {...args} store={store} onOptionSubmit={handleSubmit}>
          <Combobox.Target>
            <SearchInput
              placeholder="Pick a food…"
              value={selected ?? ""}
              readOnly
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
            <Combobox.Options>
              <Combobox.Group label="Fruit">
                <Combobox.Option value="apple" selected={selected === "apple"}>
                  Apple
                </Combobox.Option>
                <Combobox.Option value="banana" selected={selected === "banana"}>
                  Banana
                </Combobox.Option>
                <Combobox.Option value="cherry" selected={selected === "cherry"}>
                  Cherry
                </Combobox.Option>
              </Combobox.Group>
              <Combobox.Group label="Vegetables">
                <Combobox.Option value="carrot" selected={selected === "carrot"}>
                  Carrot
                </Combobox.Option>
                <Combobox.Option value="broccoli" selected={selected === "broccoli"}>
                  Broccoli
                </Combobox.Option>
              </Combobox.Group>
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {selected ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** A disabled option cannot be selected; the combobox stays open. */
export const DisabledOption: Story = {
  args: {
    size: "md",
  },

  render: (args) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const store = useCombobox({ defaultOpened: true });

    const handleSubmit = (value: string) => {
      setSelected(value);
      store.closeDropdown();
    };

    return (
      <Box gap="$sm">
        <Combobox {...args} store={store} onOptionSubmit={handleSubmit}>
          <Combobox.Target>
            <SearchInput
              placeholder="Search fruit…"
              value={selected ?? ""}
              readOnly
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
            <Combobox.Options>
              <Combobox.Option value="apple" selected={selected === "apple"}>
                Apple
              </Combobox.Option>
              <Combobox.Option value="banana" disabled>
                Banana (unavailable)
              </Combobox.Option>
              <Combobox.Option value="cherry" selected={selected === "cherry"}>
                Cherry
              </Combobox.Option>
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {selected ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Empty state message when no options match the search query. */
export const EmptyState: Story = {
  render: (args) => {
    const store = useCombobox({ defaultOpened: true });
    return (
      <Combobox {...args} store={store}>
        <Combobox.Target>
          <SearchInput
            placeholder="No matches here…"
            onFocus={() => store.openDropdown()}
            onBlur={() => store.closeDropdown()}
          />
        </Combobox.Target>
        <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
          <Combobox.Options>
            <Combobox.Empty>Nothing found for your search</Combobox.Empty>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    );
  },
};

/** Header and footer slots frame the option list with extra content. */
export const WithHeaderAndFooter: Story = {
  render: (args) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const store = useCombobox({ defaultOpened: true });

    const handleSubmit = (value: string) => {
      const match = FRUITS.find((f) => f.value === value);
      setSelected(match?.label ?? value);
      store.closeDropdown();
    };

    return (
      <Box gap="$sm">
        <Combobox {...args} store={store} onOptionSubmit={handleSubmit}>
          <Combobox.Target>
            <SearchInput
              placeholder="Search fruit…"
              value={selected ?? ""}
              readOnly
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
            <Combobox.Header>
              <Text fontSize="$xs" color="$color11">
                <Text>⭐</Text> Popular picks
              </Text>
            </Combobox.Header>
            <Combobox.Options>
              {FRUITS.slice(0, 3).map((f) => (
                <Combobox.Option key={f.value} value={f.value} selected={f.label === selected}>
                  {f.label}
                </Combobox.Option>
              ))}
            </Combobox.Options>
            <Combobox.Footer>
              <Text fontSize="$xs" color="$color11">
                Showing 3 of {FRUITS.length} results
              </Text>
            </Combobox.Footer>
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {selected ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** ClearButton and Chevron sub-components used alongside the target. */
export const WithClearAndChevron: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("Apple");
    const store = useCombobox({ defaultOpened: false });

    return (
      <Box flexDirection="row" alignItems="center" gap="$xs">
        <Combobox
          {...args}
          store={store}
          onOptionSubmit={(v) => {
            const match = FRUITS.find((f) => f.value === v);
            setValue(match?.label ?? v);
            store.closeDropdown();
          }}
        >
          <Combobox.Target>
            <SearchInput
              placeholder="Pick a fruit…"
              value={value}
              readOnly
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
            <Combobox.Options>
              {FRUITS.map((f) => (
                <Combobox.Option key={f.value} value={f.value} selected={f.label === value}>
                  {f.label}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        {value ? <Combobox.ClearButton onClear={() => setValue("")} /> : null}
        <Combobox.Chevron opened={store.opened} />
      </Box>
    );
  },
};

/**
 * Button target — use `targetType="button"` when the trigger is a control (not a
 * text field). The dropdown anchors to the button itself and a press toggles it
 * open/closed, so no focus/blur wiring is needed.
 */
export const ButtonTarget: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string | null>(null);
    const store = useCombobox({ defaultOpened: false });

    return (
      <Box gap="$sm">
        <Combobox
          {...args}
          store={store}
          onOptionSubmit={(v) => {
            const match = FRUITS.find((f) => f.value === v);
            setValue(match?.label ?? v);
            store.closeDropdown();
          }}
        >
          <Combobox.Target targetType="button">
            <Button>{value ?? "Pick a fruit"}</Button>
          </Combobox.Target>
          <Combobox.Dropdown>
            <Combobox.Options>
              {FRUITS.map((f) => (
                <Combobox.Option key={f.value} value={f.value} selected={f.label === value}>
                  {f.label}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {value ?? "—"}
        </Text>
      </Box>
    );
  },
};

/**
 * `Combobox.OptionsDropdown` renders parsed `data` into option rows for you —
 * no hand-composed `Combobox.Option` list. `value` drives the check icon and
 * `renderOption` customises each row's content.
 */
export const OptionsDropdown: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string | null>("apple");
    const store = useCombobox({ defaultOpened: true });

    return (
      <Box gap="$sm">
        <Combobox
          {...args}
          store={store}
          onOptionSubmit={(v) => {
            setValue(v);
            store.closeDropdown();
          }}
        >
          <Combobox.Target>
            <SearchInput
              placeholder="Pick a fruit…"
              value={FRUITS.find((f) => f.value === value)?.label ?? ""}
              readOnly
              onFocus={() => store.openDropdown()}
              onBlur={() => store.closeDropdown()}
            />
          </Combobox.Target>
          <Combobox.Dropdown onMouseDown={(e: React.MouseEvent) => e.preventDefault()}>
            <Combobox.OptionsDropdown
              data={FRUITS}
              value={value}
              renderOption={({ option, checked }) => (
                <Text flex={1} fontSize="$sm" color="$color12">
                  {checked ? "★ " : ""}
                  {option.label}
                </Text>
              )}
            />
          </Combobox.Dropdown>
        </Combobox>
        <Text fontSize="$xs" color="$color11">
          selected: {value ?? "—"}
        </Text>
      </Box>
    );
  },
};
