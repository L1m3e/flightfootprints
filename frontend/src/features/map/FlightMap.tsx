import "maplibre-gl/dist/maplibre-gl.css"

import type { ExpressionSpecification, LngLatBoundsLike } from "maplibre-gl"
// MapLibre does its heavy lifting (reading tiles, cutting GeoJSON into tiles) in a web
// worker, and by default looks for the worker file next to its own module. A bundler
// moves and renames modules, so that guess is wrong under Vite. "?url" asks Vite for the
// address the file really ends up at, in development and in a build; the map gets it
// through its workerUrl prop. Without it nothing that comes from a data source is drawn.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url"
import { useImperativeHandle, useMemo, useRef, useState, type Ref } from "react"
import { useTranslation } from "react-i18next"
import {
  GlobeControl,
  Layer,
  Map,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre"

import type { Flight } from "@/features/flights/api"
import { boundsOf, buildAirportPoints, buildFlightArcs, type Bounds } from "@/features/map/geo"
import { BASEMAP_STYLE_URL, EMPTY_STYLE, LABEL_FONT, MAP_COLORS } from "@/features/map/mapStyle"

const ARC_LAYER = "flight-arcs"
const POINTER_AREA_LAYER = "flight-arcs-pointer-area"

/**
 * Flights between the same two airports share one geometry. Each is shifted sideways by
 * its lane number times this many pixels, so they lie next to each other.
 */
const LANE_SPACING = 3
const laneOffset: ExpressionSpecification = ["*", ["get", "lane"], LANE_SPACING]

/**
 * How far from a click (in pixels) a line is looked for. The search widens step by step,
 * so the line nearest to the click wins even when several are close.
 */
const CLICK_REACH = [2, 5, 9]

/** Mercator stretches towards the poles; framing a polar route up to 85° would zoom far out. */
const MAX_FRAMED_LATITUDE = 78

function toMapBounds([west, south, east, north]: Bounds): LngLatBoundsLike {
  return [
    [west, Math.max(south, -MAX_FRAMED_LATITUDE)],
    [east, Math.min(north, MAX_FRAMED_LATITUDE)],
  ]
}

export interface FlightMapHandle {
  /** Moves the map so that the whole route of this flight is visible. */
  showFlight: (flightId: number) => void
}

export function FlightMap({
  flights,
  selectedFlightId,
  onSelect,
  onBasemapUnavailable,
  ref,
}: {
  flights: Flight[]
  selectedFlightId: number | null
  onSelect: (flightId: number | null) => void
  /** Called once if the basemap could not be loaded and the plain background is used instead. */
  onBasemapUnavailable?: () => void
  ref?: Ref<FlightMapHandle>
}) {
  const { t, i18n } = useTranslation()
  const mapRef = useRef<MapRef>(null)
  const basemapLoaded = useRef(false)
  const [basemapFailed, setBasemapFailed] = useState(false)
  const [cursor, setCursor] = useState("")

  const arcs = useMemo(() => buildFlightArcs(flights), [flights])
  const airports = useMemo(() => buildAirportPoints(flights), [flights])

  // Where the map starts: framed around all routes, or the whole world when there are none.
  // Only read when the map is created.
  const initialViewState = useMemo(() => {
    const bounds = boundsOf(arcs.features.map((feature) => feature.geometry))
    return bounds
      ? { bounds: toMapBounds(bounds), fitBoundsOptions: { padding: 48, maxZoom: 5 } }
      : { longitude: 110, latitude: 25, zoom: 1.2 }
  }, [arcs])

  useImperativeHandle(ref, () => ({
    showFlight(flightId) {
      const arc = arcs.features.find((feature) => feature.properties.flightId === flightId)
      const bounds = arc && boundsOf([arc.geometry])
      if (bounds) {
        mapRef.current?.fitBounds(toMapBounds(bounds), { padding: 64, maxZoom: 5, duration: 700 })
      }
    },
  }))

  function handleClick(event: MapLayerMouseEvent) {
    const map = mapRef.current
    if (!map) return
    const { x, y } = event.point
    for (const reach of CLICK_REACH) {
      const hits = map.queryRenderedFeatures(
        [
          [x - reach, y - reach],
          [x + reach, y + reach],
        ],
        { layers: [ARC_LAYER] },
      )
      if (hits.length > 0) {
        onSelect(hits[0].properties.flightId as number)
        return
      }
    }
    // A click on empty map clears the selection.
    onSelect(null)
  }

  // MapLibre's own buttons and hints, in the language of the page.
  const locale = useMemo(
    () => ({
      "Map.Title": t("map.controls.mapTitle"),
      "NavigationControl.ZoomIn": t("map.controls.zoomIn"),
      "NavigationControl.ZoomOut": t("map.controls.zoomOut"),
      "GlobeControl.Enable": t("map.controls.globeOn"),
      "GlobeControl.Disable": t("map.controls.globeOff"),
      "AttributionControl.ToggleAttribution": t("map.controls.toggleAttribution"),
      "CooperativeGesturesHandler.WindowsHelpText": t("map.controls.gestureWindows"),
      "CooperativeGesturesHandler.MacHelpText": t("map.controls.gestureMac"),
      "CooperativeGesturesHandler.MobileHelpText": t("map.controls.gestureMobile"),
    }),
    [t],
  )

  // On a touch screen one finger scrolls the page and two fingers move the map. Without
  // this, a map that fills the screen swallows every attempt to scroll past it.
  const touchScreen = useMemo(() => window.matchMedia("(pointer: coarse)").matches, [])

  return (
    <Map
      // The texts above are only read when the map is created, so a change of language
      // creates a new map.
      key={i18n.resolvedLanguage}
      ref={mapRef}
      initialViewState={initialViewState}
      mapStyle={basemapFailed ? EMPTY_STYLE : BASEMAP_STYLE_URL}
      workerUrl={maplibreWorkerUrl}
      locale={locale}
      cooperativeGestures={touchScreen}
      // Tilting and rotating add nothing to a route map and are easy to trigger by accident.
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      interactiveLayerIds={[POINTER_AREA_LAYER]}
      cursor={cursor}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("")}
      onClick={handleClick}
      onStyleData={() => {
        basemapLoaded.current = true
      }}
      onError={() => {
        // Errors after the style has arrived are about single tiles; the map copes with
        // those. An error before that means the basemap itself is unreachable.
        if (!basemapLoaded.current && !basemapFailed) {
          setBasemapFailed(true)
          onBasemapUnavailable?.()
        }
      }}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <GlobeControl position="top-right" />

      <Source id="flights" type="geojson" data={arcs}>
        <Layer
          id={ARC_LAYER}
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": MAP_COLORS.arc,
            "line-width": 1.6,
            "line-opacity": 0.8,
            "line-offset": laneOffset,
          }}
        />
        <Layer
          id="flight-arc-selected"
          type="line"
          filter={["==", ["get", "flightId"], selectedFlightId ?? -1]}
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{
            "line-color": MAP_COLORS.arcSelected,
            "line-width": 3.5,
            "line-offset": laneOffset,
          }}
        />
        {/* Invisible and wide: only there so the pointer turns into a hand near a line. */}
        <Layer
          id={POINTER_AREA_LAYER}
          type="line"
          paint={{ "line-color": "#000000", "line-opacity": 0, "line-width": 12, "line-offset": laneOffset }}
        />
      </Source>

      <Source id="airports" type="geojson" data={airports}>
        <Layer
          id="airport-dots"
          type="circle"
          paint={{
            // A little larger for airports with more flights, from 3.5 px up to 7 px.
            "circle-radius": ["interpolate", ["linear"], ["get", "flights"], 1, 3.5, 10, 7],
            "circle-color": MAP_COLORS.airportFill,
            "circle-stroke-color": MAP_COLORS.airportStroke,
            "circle-stroke-width": 1.5,
          }}
        />
        {/* Text needs the basemap's font server, so there are no labels on the plain background. */}
        {!basemapFailed && (
          <Layer
            id="airport-labels"
            type="symbol"
            layout={{
              "text-field": ["get", "iata"],
              "text-font": LABEL_FONT,
              "text-size": 11,
              "text-anchor": "top",
              "text-offset": [0, 0.7],
            }}
            paint={{
              "text-color": MAP_COLORS.label,
              "text-halo-color": MAP_COLORS.labelHalo,
              "text-halo-width": 1.5,
            }}
          />
        )}
      </Source>
    </Map>
  )
}
