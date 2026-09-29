import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Inbox from "@/pages/Inbox";
import { TooltipProvider } from "@/components/ui/tooltip";
import { seedFeedback } from "@/data/feedback";
import { feedbackService } from "@/services/feedback-service";
import { toast } from "sonner";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function renderInbox() {
  let items = seedFeedback.slice(0, 2);
  vi.spyOn(feedbackService, "listFeedback").mockImplementation(() => [...items]);
  const deleteFeedback = vi.spyOn(feedbackService, "deleteFeedback").mockImplementation((id) => {
    items = items.filter((item) => item.id !== id);
    return [...items];
  });
  render(
    <TooltipProvider>
      <Inbox />
    </TooltipProvider>,
  );
  return deleteFeedback;
}

describe("feedback deletion confirmation", () => {
  it("keeps the feedback and selection when canceled", () => {
    const deleteFeedback = renderInbox();
    fireEvent.click(screen.getByRole("button", { name: "Delete feedback" }));
    expect(deleteFeedback).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(deleteFeedback).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: seedFeedback[0]!.summary })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Marta Holloway/ }).getAttribute("aria-current"),
    ).toBe("true");
  });

  it("deletes only after confirmation and selects another available item", () => {
    const deleteFeedback = renderInbox();
    fireEvent.click(screen.getByRole("button", { name: "Delete feedback" }));
    expect(deleteFeedback).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: /^Delete$/ }),
    );
    expect(deleteFeedback).toHaveBeenCalledExactlyOnceWith(seedFeedback[0]!.id);
    expect(toast.success).toHaveBeenCalledExactlyOnceWith("Feedback deleted");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("button", { name: /Marta Holloway/ })).toBeNull();
    expect(screen.getByRole("heading", { name: seedFeedback[1]!.summary })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Devon Park/ }).getAttribute("aria-current")).toBe(
      "true",
    );
  });
});
