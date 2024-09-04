import { defineStyleConfig, extendTheme } from "@chakra-ui/react";

const Card = defineStyleConfig({
  baseStyle: {
    container: {
      bg: "bg.card",
      borderRadius: "md",
      boxShadow: "md",
    },
  },
});

const customTheme = {
  fonts: {
    heading: `'Roboto Mono', sans-serif`,
    body: `'Roboto Mono', sans-serif`,
  },
  components: {
    Card,
  },
  semanticTokens: {
    colors: {
      bg: {
        page: {
          default: "#f5f4f5",
          _dark: "#151D32",
        },
        pageDark: {
          default: "#FFF",
          _dark: "#1c2745",
        },
        card: {
          default: "#FFF",
          _dark: "#292F45",
        },
        cardDark: {
          default: "#F3F3F3",
          _dark: "#1c2745",
        },
        navbar: {
          default: "#FFF",
          _dark: "#292F45",
        },
        primary: {
          default: "#608DFF",
          _dark: "#1E5EFF",
        },
        secondary: {
          default: "#A75EF1",
          _dark: "#1E5EFF",
        },
      },
      border: {
        primary: {
          default: "#E6E9F4",
          _dark: "#28272F",
          hover: "#608DFF",
        },
        secondary: {
          default: "#D7DBEC",
          _dark: "#3E3E47",
          hover: "#A75EF1",
        },
      },
      text: {
        primary: {
          default: "#2E384D",
          _dark: "#FFF",
        },
        secondary: {
          default: "#7B8BB2",
          _dark: "#A6A6A6",
        },
      },
    },
  },
};

const Theme = extendTheme(customTheme);

export type ThemeType = typeof customTheme;

export default Theme;
