// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LocaleProvider, useLocale } from "@/components/providers/LocaleProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/messages";

function LocaleProbe() {
  const { locale, messages } = useLocale();

  return (
    <div>
      <p data-testid="locale-value">{locale}</p>
      <p>{messages.home.startButtonIdle}</p>
    </div>
  );
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("switches between zh-CN and en and persists the choice", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh-CN");

    render(
      <LocaleProvider>
        <LanguageSwitcher />
        <LocaleProbe />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("locale-value")).toHaveTextContent("zh-CN"),
    );
    expect(screen.getByText("立即开战")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "EN" }));

    await waitFor(() =>
      expect(screen.getByTestId("locale-value")).toHaveTextContent("en"),
    );
    expect(screen.getByText("PLAY NOW")).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dataset.locale).toBe("en");
  });

  it("does not bounce back to zh-CN after selecting EN", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh-CN");

    render(
      <LocaleProvider>
        <LanguageSwitcher />
        <LocaleProbe />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("locale-value")).toHaveTextContent("zh-CN"),
    );

    await user.click(screen.getByRole("button", { name: "EN" }));

    await waitFor(() =>
      expect(screen.getByTestId("locale-value")).toHaveTextContent("en"),
    );

    await new Promise((resolve) => {
      window.setTimeout(resolve, 50);
    });

    expect(screen.getByTestId("locale-value")).toHaveTextContent("en");
    expect(screen.getByText("PLAY NOW")).toBeInTheDocument();
  });
});
