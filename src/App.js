import { useState, useEffect } from "react";

import "./App.css";

const KEY = "b204a32d";

export default function App() {
  const [query, setQuery] = useState("");
  const [watched, setWatched] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  function deleteMovie(imdbID) {
    setWatched((movies) => movies.filter((movie) => movie.imdbID !== imdbID));
  }

  function watchedMoviesHandler(movie) {
    setWatched((movies) => [...movies, movie]);

    localStorage.setItem("watched", JSON.stringify([...watched, movie]));
  }
  function selectMovieHandler(id) {
    setSelectedMovie(id);
  }
  function onCloseMovie() {
    return setSelectedMovie(null);
  }
  useEffect(function () {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        onCloseMovie();
      }
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    async function fetching() {
      try {
        setIsLoading(true);

        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal }
        );

        if (!response.ok) throw new Error("There is something wrong!");

        const data = await response.json();

        if (query === "") {
          return setErrors("");
        }
        if (data.Response === "False") {
          throw new Error("The movie does not match");
        }

        setMovies(data.Search);
        setErrors("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setErrors(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetching();
    // Abort the fetch if this component unmounts
    return () => {
      controller.abort();
    };

    // Call the fetching function immediately
  }, [query]);

  return (
    <>
      <Navbar className="ne">
        <SearchBar query={query} setQuery={setQuery} />
        <Results movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !errors && (
            <MovieList
              movies={movies}
              selectedMovie={selectedMovie}
              onSelectedMovie={selectMovieHandler}
            />
          )}
          {errors && <Err error={errors} />}
        </Box>
        <Box>
          {selectedMovie ? (
            <MovieDetails
              selectedMovie={selectedMovie}
              onCloseMovie={onCloseMovie}
              onWatchedMovies={watchedMoviesHandler}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} deleteMovie={deleteMovie} />
              <ListWatchedMovies watched={watched} deleteMovie={deleteMovie} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Err({ error }) {
  return <p className="error"> {error}</p>;
}
function Loader() {
  return <p className="loader">loading...</p>;
}
function Navbar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />

      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img"> 🌟</span>
      <h1>Shakar's Rating</h1>
    </div>
  );
}

function SearchBar({ query, setQuery }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function Results({ movies }) {
  return (
    <>
      <p className="num-results">
        Found <strong>{movies.length}</strong> results
      </p>
    </>
  );
}

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

function Main({ children }) {
  return (
    <>
      <main className="main">{children}</main>
    </>
  );
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectedMovie, deleteMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          onSelectedMovie={() => onSelectedMovie(movie.imdbID)} // Call the function with imdbID
          deleteMovie={deleteMovie}
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectedMovie }) {
  return (
    <li onClick={() => onSelectedMovie(movie.imdbID)} key={movie.imdbID}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}
function MovieDetails({
  selectedMovie,
  onCloseMovie,
  onWatchedMovies,
  watched,
}) {
  const [movie, setMovie] = useState({});
  const [userRating, setUserRating] = useState(0);

  const isWatched = watched
    .map((movie) => movie.imdbID)
    .includes(selectedMovie);
  const userRatedMovie = watched.find(
    (movie) => movie.imdbID === selectedMovie
  )?.userRating;
  const {
    Poster: poster,
    Title: title,
    Genre: genre,

    Year: year,
    Released: released,
    imdbRating,
    Runtime: runtime,
  } = movie;

  const [isTop, setIsTop] = useState(true);
  useEffect(
    function () {
      setIsTop(imdbRating > 8);
      console.log(isTop);
    },
    [imdbRating, isTop]
  );
  function watchedHandler() {
    const watchedItem = {
      imdbID: selectedMovie,
      poster,
      title,
      year,
      imdbRating: Number(imdbRating),
      runtime: parseInt(runtime.split(" ")[0]),

      userRating, // Use the userRating state variable
    };
    onWatchedMovies(watchedItem);
    onCloseMovie();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const userHistory = [];
  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie: ${title}`;

      return () => {
        document.title = "Movie Time";
        console.log("User history:");
        userHistory.push(title);
        console.log(userHistory);
      };
    },
    [title, userHistory]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const controller = new AbortController();
  const signal = controller.signal;
  useEffect(
    function () {
      async function fetchId() {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedMovie}`,
          { signal }
        );
        const data = await response.json();
        setMovie(data);
      }
      setTimeout(() => {
        return controller;
      }, 5000);
      fetchId();
    },
    [controller, selectedMovie, signal]
  );
  return (
    <div className="details">
      <header>
        <button className="remove-btn" onClick={onCloseMovie}>
          {" "}
          -{" "}
        </button>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={poster} key={movie.title} />
        <div className="details-overview">
          <h2> {title} </h2>

          <h3> {released} </h3>
          <h4>{genre}</h4>
        </div>
      </header>

      <section>
        {!isWatched ? (
          <>
            {" "}
            <StarRating maxStar={10} setUserRating={setUserRating} />
            {userRating > 0 && (
              <button onClick={watchedHandler} className="btn-add">
                + Add to watched list{" "}
              </button>
            )}
          </>
        ) : (
          <p> You have rated this movie with {userRatedMovie}</p>
        )}

        <p>{movie.Plot} </p>
        <p>{movie.Director} </p>
        <p>{movie.Charechters} </p>
      </section>
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={watched.poster} />
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgUserRating}</span>
        </p>

        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function ListWatchedMovies({ watched, deleteMovie }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          deleteMovie={() => deleteMovie(movie.imdbID)} // Pass the imdbID to deleteMovie
          key={movie.imdbID}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, deleteMovie }) {
  return (
    <li key={movie.imdbID} className="watchedList">
      <img src={movie.poster} alt={`${movie.Title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <span className="remove-movie" onClick={deleteMovie}>
          ⛔
        </span>
      </div>
    </li>
  );
}

function StarRating({ maxStar, setUserRating }) {
  const [star, setStar] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  setUserRating(star);
  const textColor = {
    color: "#333",
    size: 30,
  };
  function ratingHandler(i) {
    setStar(i + 1);
  }
  return (
    <div className="star-section">
      {Array.from({ length: maxStar }, (_, i) => {
        return (
          <Star
            color={textColor.color}
            size={textColor.size}
            key={i}
            onRate={() => ratingHandler(i)}
            full={hoverStar ? hoverStar >= i + 1 : star >= i + 1}
            onHoverIn={() => {
              setHoverStar(i + 1);
            }}
            onHoverOut={() => {
              setHoverStar(0);
            }}
          />
        );
      })}
      <p
        className="ratingCounter"
        style={{ color: textColor.color, fontSize: textColor.size }}
      >
        {hoverStar || star || ""}{" "}
      </p>
    </div>
  );
}

function Star({ onRate, full, onHoverIn, onHoverOut, color, size }) {
  return (
    <div className="stars">
      <span
        className="starss"
        onClick={onRate}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
      >
        {" "}
        {full ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill={color}
            stroke={color}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="{2}"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        )}
      </span>
    </div>
  );
}
