import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
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

  // The input also holds the label of the chosen airport. That text is not a search.
  const search = value !== null && typed === airportLabel(value) ? "" : typed.trim()
  const term = useDebouncedValue(search, 200)
  const { data: matches = [], isFetching } = useQuery(airportSearchQuery(term))

  // While something is typed, the list holds only what the server found, best match
  // first. It is empty until the answer arrives: the component highlights the first row
  // (the one Enter picks) when an empty list fills up, and showing the current choice in
  // the meantime would use up that highlight on the wrong row.
  // With nothing typed, the list shows the current choice.
  let items: Airport[] = []
  if (search !== "") items = matches
  else if (value !== null) items = [value]

  let emptyText = t("flights.airportNoMatch")
  if (search === "") emptyText = t("flights.airportTypeToSearch")
  else if (isFetching || search !== term) emptyText = t("flights.airportSearching")

  return (
    <Combobox
      items={items}
      // The server already did the filtering and ordering.
      filter={null}
      value={value}
      onValueChange={(airport: Airport | null) => {
        onChange(airport)
        // The search is over once something is picked (or the choice is cleared).
        setTyped("")
      }}
      onInputValueChange={(text, { reason }) => {
        // Picking an item writes its label into the input; only real typing is a search.
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
        onKeyDown={(event) => {
          // Enter picks the highlighted airport. When no row is highlighted the browser
          // would submit the whole form instead, which is never what Enter means here.
          if (event.key === "Enter") event.preventDefault()
        }}
        showClear={value !== null}
        clearLabel={t("flights.airportClear")}
        triggerLabel={t("flights.airportShowList")}
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
