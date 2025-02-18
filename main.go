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

func isAuthenticated(r *http.Request) bool {
	cookie, err := r.Cookie("session")
	return err == nil && cookie.Value == "authenticated"
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

			// Set session cookie
			http.SetCookie(w, &http.Cookie{
				Name:  "session",
				Value: "authenticated",
				Path:  "/",
			})

			w.Write([]byte("thank u daddy"))
			return
		}
		fmt.Println("[LOG] Login failed")
		w.Write([]byte("naah"))
		return
	}
	templates.ExecuteTemplate(w, "login.html", nil)
}

func puzzleHandler(w http.ResponseWriter, r *http.Request) {
	if !isAuthenticated(r) {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}
	fmt.Println("[LOG] Accessed puzzle page")
	templates.ExecuteTemplate(w, "puzzle.html", nil)
}

func secretHandler(w http.ResponseWriter, r *http.Request) {
	obraCode := os.Getenv("OBRA_CODE")
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"code": "%s"}`, obraCode)
}

func allCodesHandler(w http.ResponseWriter, r *http.Request) {
	obraCode := os.Getenv("OBRA_CODE")
	discoCode := os.Getenv("DISCO_CODE")
	babaCode := os.Getenv("BABA_CODE")
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"obra": "%s", "disco": "%s", "baba": "%s"}`, obraCode, discoCode, babaCode)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[LOG] Accessed register page")
	w.Write([]byte("u wish buddy ;)"))
}

func main() {
	fmt.Println("[LOG] Server started on port 8080")

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Serve images from the images folder
	http.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir("images"))))

	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/elzzup", puzzleHandler)
	http.HandleFunc("/puzzle", puzzleHandler)
	http.HandleFunc("/secret", secretHandler)
	http.HandleFunc("/allcodes", allCodesHandler)
	http.HandleFunc("/register", registerHandler)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("[ERROR] Failed to start server:", err)
	}
}
