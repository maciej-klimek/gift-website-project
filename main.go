package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"html/template"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

var templates = template.Must(template.ParseFiles(
	"templates/index.html",
	"templates/login.html",
	"templates/puzzle.html",
))

var (
	validUsername     string
	validPasswordHash string
)

func init() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("[LOG] Warning: No .env file found")
	}
	validUsername = os.Getenv("USERNAME")
	validPasswordHash = os.Getenv("CODE_HASH")
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[LOG] Accessed index page")
	templates.ExecuteTemplate(w, "index.html", nil)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[LOG] Accessed login page")
	if r.Method == http.MethodPost {
		username := r.FormValue("username")
		password := r.FormValue("code")
		fmt.Printf("[LOG] Login attempt - Username: %s\n", username)
		if username == validUsername && hashPassword(password) == validPasswordHash {
			fmt.Println("[LOG] Login successful")
			http.Redirect(w, r, "/puzzle", http.StatusSeeOther)
			return
		}
		fmt.Println("[LOG] Login failed")
	}
	templates.ExecuteTemplate(w, "login.html", nil)
}

func puzzleHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[LOG] Accessed puzzle page")
	templates.ExecuteTemplate(w, "puzzle.html", nil)
}

// secretHandler returns the secret code (only if the puzzle is solved)
func secretHandler(w http.ResponseWriter, r *http.Request) {
	// In production, you'd validate that the user solved the puzzle (e.g., via session data)
	secretCode := os.Getenv("SECRET_CODE") // Set this in your .env file
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"code": "%s"}`, secretCode)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[LOG] Accessed register page")
	w.Write([]byte("u wish buddy ;)"))
}

func main() {
	fmt.Println("[LOG] Server started on port 8080")

	// Serve static files from "static" directory
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/puzzle", puzzleHandler)
	http.HandleFunc("/secret", secretHandler)
	http.HandleFunc("/register", registerHandler)

	http.ListenAndServe(":8080", nil)
}
