import { describe, expect, it } from "vitest"

import { cityName, countryName, placeName, type Place } from "@/features/flights/places"

const PVG: Place = { city: "Shanghai (Pudong)", cityZh: "上海", country: "CN" }
const HKG: Place = { city: "Hong Kong", cityZh: "香港", country: "HK" }
const JFK: Place = { city: "New York", cityZh: "纽约", country: "US" }
const SIN: Place = { city: "Singapore", cityZh: "新加坡", country: "SG" }
/** An atoll in French Polynesia: no Chinese name is known for it. */
const AAA: Place = { city: "Anaa", cityZh: null, country: "PF" }
const NO_CITY: Place = { city: null, cityZh: null, country: "JP" }

describe("cityName", () => {
  it("is the Chinese name on a Chinese page", () => {
    expect(cityName(PVG, "zh")).toBe("上海")
    expect(cityName(PVG, "zh-CN")).toBe("上海")
  })

  it("is the English name on an English page", () => {
    expect(cityName(PVG, "en")).toBe("Shanghai (Pudong)")
  })

  it("falls back to the English name where no Chinese one is known", () => {
    expect(cityName(AAA, "zh")).toBe("Anaa")
  })

  it("is nothing for an airport without a city", () => {
    expect(cityName(NO_CITY, "en")).toBeNull()
    expect(cityName(NO_CITY, "zh")).toBeNull()
  })
})

describe("countryName", () => {
  it("names a country in the language of the page", () => {
    expect(countryName("CN", "en")).toBe("China")
    expect(countryName("CN", "zh")).toBe("中国")
    expect(countryName("US", "en")).toBe("United States")
    expect(countryName("US", "zh")).toBe("美国")
  })

  // Browsers differ here: some say "Hong Kong SAR China", some "Hong Kong".
  it("calls Hong Kong and Macao by their short names", () => {
    expect(countryName("HK", "en")).toBe("Hong Kong")
    expect(countryName("HK", "zh")).toBe("香港")
    expect(countryName("MO", "zh")).toBe("澳门")
  })
})

describe("placeName", () => {
  it("is city and country in one language", () => {
    expect(placeName(PVG, "en")).toBe("Shanghai (Pudong), China")
    expect(placeName(PVG, "zh")).toBe("上海，中国")
    expect(placeName(JFK, "en")).toBe("New York, United States")
    expect(placeName(JFK, "zh")).toBe("纽约，美国")
  })

  // The two complaints: "Hong Kong, Hong Kong" in English and "Hong Kong, 香港" in Chinese.
  it("says a name once where the city and the region share it", () => {
    expect(placeName(HKG, "en")).toBe("Hong Kong")
    expect(placeName(HKG, "zh")).toBe("香港")
    expect(placeName(SIN, "en")).toBe("Singapore")
    expect(placeName(SIN, "zh")).toBe("新加坡")
  })

  it("keeps the English city where no Chinese name is known", () => {
    expect(placeName(AAA, "zh")).toBe("Anaa，法属波利尼西亚")
    expect(placeName(AAA, "en")).toBe("Anaa, French Polynesia")
  })

  it("shows only the country, in Chinese, when an untranslated city is the country's English name", () => {
    const luxembourg: Place = { city: "Luxembourg", cityZh: null, country: "LU" }

    expect(placeName(luxembourg, "zh")).toBe("卢森堡")
    expect(placeName(luxembourg, "en")).toBe("Luxembourg")
  })

  it("does not take a city that merely contains the country's name for the same name", () => {
    const kuwaitCity: Place = { city: "Kuwait City", cityZh: "科威特城", country: "KW" }

    expect(placeName(kuwaitCity, "en")).toBe("Kuwait City, Kuwait")
    expect(placeName(kuwaitCity, "zh")).toBe("科威特城，科威特")
  })

  it("shows the country alone for an airport without a city, or what it is given instead", () => {
    expect(placeName(NO_CITY, "en")).toBe("Japan")
    expect(placeName(NO_CITY, "zh", "Some Airfield")).toBe("Some Airfield，日本")
  })
})
