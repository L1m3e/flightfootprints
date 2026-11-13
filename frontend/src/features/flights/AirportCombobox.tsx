import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { airportSearchQuery, type Airport } from "@/features/flights/api"
import { useFormatters } from "@/lib/format"
import { useDebouncedValue } from "@/lib/useDebouncedValue"

/** What the input shows once an airport is chosen: "PVG · Shanghai (Pudong)". */
function airportLabel(airport: Airport): string {
  return `${airport.iata} · ${airport.city ?? airport.name}`
}

/**
 * Text box that searches airports on the server while the visitor types an IATA code,
 * a city or an airport name, and lets them pick one of the matches.
 */
export function AirportCombobox({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id: string
  value: Airport | null
  onChange: (airport: Airport | null) => void
  onBlur?: () => void
  invalid?: boolean
}) {
  const { t } = useTranslation()
  const format = useFormatters()
  const [typed, setTyped] = useState("")
  const term = useDebouncedValue(typed.trim(), 200)
  const { data: matches = [], isFetching } = useQuery(airportSearchQuery(term))

  // The selected airport has to stay in the list, or the component could not show it
  // as selected once the matches change.
  const items = useMemo(() => {
    const visible = term === "" ? [] : matches
    if (value === null || visible.some((airport) => airport.iata === value.iata)) return visible
    return [value, ...visible]
  }, [matches, term, value])

  let emptyText = t("flights.airportNoMatch")
  if (typed.trim() === "") emptyText = t("flights.airportTypeToSearch")
  else if (isFetching || typed.trim() !== term) emptyText = t("flights.airportSearching")

  return (
    <Combobox
      items={items}
      // The server already did the filtering and ordering.
      filter={null}
      value={value}
      onValueChange={(airport: Airport | null) => onChange(airport)}
      onInputValueChange={(text, { reason }) => {
        // Picking an item writes its label into the input. That is not a search.
        if (reason !== "item-press") setTyped(text)
      }}
      itemToStringLabel={airportLabel}
      isItemEqualToValue={(item: Airport, selected: Airport) => item.iata === selected.iata}
      autoHighlight
    >
      <ComboboxInput
        id={id}
        placeholder={t("flights.airportPlaceholder")}
        aria-invalid={invalid}
        onBlur={onBlur}
        showClear={value !== null}
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(airport: Airport) => (
            <ComboboxItem key={airport.iata} value={airport}>
              <span className="w-9 shrink-0 font-mono font-medium">{airport.iata}</span>
              <span className="min-w-0">
                <span className="block truncate">{airport.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[airport.city, format.country(airport.country)].filter(Boolean).join(", ")}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
