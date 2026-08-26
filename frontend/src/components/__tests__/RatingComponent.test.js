import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RatingComponent from "../RatingComponent";

describe("RatingComponent", () => {
  test("renders without crashing", () => {
    render(<RatingComponent />);
    expect(screen.getByTestId("rating-text")).toBeInTheDocument();
  });

  test("displays correct initial rating", () => {
    render(<RatingComponent initialRating={3} />);
    // Should display 3.0 rating text
    expect(screen.getByText(/3\.0 sur 5/i)).toBeInTheDocument();
  });

  test("calls onRatingChange when a star is clicked", () => {
    const mockOnRatingChange = jest.fn();
    render(<RatingComponent onRatingChange={mockOnRatingChange} />);

    // Get the first star and click it
    const firstStar = screen.getByTestId("star-1");
    fireEvent.click(firstStar);

    expect(mockOnRatingChange).toHaveBeenCalledWith(1);
  });

  test("shows rating text when showText is true", () => {
    render(<RatingComponent initialRating={4} showText={true} />);
    expect(screen.getByText(/4\.0 sur 5/i)).toBeInTheDocument();
  });

  test("hides rating text when showText is false", () => {
    render(<RatingComponent initialRating={4} showText={false} />);
    expect(screen.queryByTestId("rating-text")).not.toBeInTheDocument();
  });

  test("renders in readonly mode when readonly is true", () => {
    render(<RatingComponent initialRating={3} readonly={true} />);
    const firstStar = screen.getByTestId("star-1");
    // In readonly mode, stars should not be clickable
    expect(firstStar).toHaveStyle({ cursor: "default" });
  });
});
