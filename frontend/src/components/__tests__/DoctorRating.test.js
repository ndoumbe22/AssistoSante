import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DoctorRating from "../DoctorRating";

// Mock the AuthContext
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, username: "testpatient", role: "patient" },
  }),
}));

describe("DoctorRating", () => {
  test("renders without crashing", () => {
    render(<DoctorRating doctorId={1} />);
    expect(screen.getByText("Évaluer ce médecin")).toBeInTheDocument();
  });

  test("shows error when submitting without rating", () => {
    render(<DoctorRating doctorId={1} />);

    const submitButton = screen.getByText("Soumettre l'évaluation");
    fireEvent.click(submitButton);

    expect(
      screen.getByText("Veuillez sélectionner une note")
    ).toBeInTheDocument();
  });

  test("shows error when comment is too short", () => {
    render(<DoctorRating doctorId={1} />);

    // Select a rating
    const stars = screen.getAllByRole("button");
    fireEvent.click(stars[3]); // Click 4th star

    // Submit with short comment
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Short" } });

    const submitButton = screen.getByText("Soumettre l'évaluation");
    fireEvent.click(submitButton);

    expect(
      screen.getByText("Votre commentaire doit contenir au moins 10 caractères")
    ).toBeInTheDocument();
  });

  test("shows success message after valid submission", async () => {
    render(<DoctorRating doctorId={1} />);

    // Select a rating
    const stars = screen.getAllByRole("button");
    fireEvent.click(stars[4]); // Click 5th star

    // Add a valid comment
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "Excellent médecin, très professionnel et à l'écoute." },
    });

    const submitButton = screen.getByText("Soumettre l'évaluation");
    fireEvent.click(submitButton);

    // Should show success message
    expect(
      await screen.findByText("Merci pour votre évaluation !")
    ).toBeInTheDocument();
  });
});
