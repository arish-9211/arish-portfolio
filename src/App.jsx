import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  Github,
  Linkedin,
  Download,
  Menu,
  X,
  Code2,
  Database,
  Braces,
  MapPin,
  Mail,
  Check,
  BookOpen,
  ExternalLink,
} from "lucide-react";

import initial from "./content.json";
import { api } from "./api.js";


function Modal({
  title,
  children,
  onClose,
}) {
  const ref = useRef();

  useEffect(() => {
    ref.current.showModal();

    const old = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = old;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
      aria-labelledby="modal-title"
    >
      <button
        autoFocus
        className="icon close"
        aria-label="Close details"
        onClick={onClose}
      >
        <X />
      </button>

      <h2 id="modal-title">
        {title}
      </h2>

      {children}
    </dialog>
  );
}


function External({
  href,
  children,
  ...props
}) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ) : null;
}


function Contact({
  profile,
  connected,
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e.preventDefault();

    setBusy(true);
    setStatus("");

    const form = e.currentTarget;

    try {
      await api("/messages", {
        method: "POST",
        body: JSON.stringify(
          Object.fromEntries(
            new FormData(form)
          )
        ),
      });

      setStatus(
        "Your message is saved in Arish’s inbox. Thank you!"
      );

      form.reset();
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="contact"
      className="contact section wrap"
    >
      <div>
        <div className="eyebrow">
          06 / LET’S CONNECT
        </div>

        <h2>
          Have something
          <br />
          <em>in mind?</em>
        </h2>

        <p>
          A project, an opportunity, or a good conversation.
          <br />
          I’d love to hear from you.
        </p>

        <a
          className="email"
          href={`mailto:${profile.email}`}
        >
          {profile.email}
        </a>

        <div className="contact-links">
          <External href={profile.github}>
            <Github size={18} />
            GitHub
          </External>

          <External href={profile.linkedin}>
            <Linkedin size={18} />
            LinkedIn
          </External>
        </div>
      </div>

      {connected ? (
        <form
          className="contact-form"
          onSubmit={send}
        >
          <label>
            Your name

            <input
              name="name"
              required
              maxLength={200}
              autoComplete="name"
            />
          </label>

          <label>
            Email address

            <input
              type="email"
              name="email"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Message

            <textarea
              name="message"
              rows={4}
              minLength={10}
              maxLength={5000}
              required
              placeholder="Tell me a little about it…"
            />
          </label>

          <div
            className="honeypot"
            aria-hidden="true"
          >
            <label>
              Website

              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          <button
            className="button mint"
            disabled={busy}
          >
            {busy
              ? "Sending…"
              : "Send message"}
          </button>

          <p
            role="status"
            className="form-status"
          >
            {status}
          </p>
        </form>
      ) : (
        <div className="contact-note">
          <Mail size={38} />

          <h3>
            Start with a hello.
          </h3>

          <p>
            Email is the best way to reach me.
          </p>

          <a
            className="button mint"
            href={`mailto:${profile.email}`}
          >
            Write an email
          </a>
        </div>
      )}
    </section>
  );
}


export default function Portfolio() {
  const [data, setData] = useState(initial);

  const [connected, setConnected] =
    useState(false);

  const [menu, setMenu] =
    useState(false);

  const [filter, setFilter] =
    useState("All");

  const [project, setProject] =
    useState(null);

  const [post, setPost] =
    useState(null);


  useEffect(() => {
    api("/content")
      .then((d) => {
        setData(d);
        setConnected(true);
      })
      .catch(() => {});
  }, []);


  const p = data.profile;

  const filters = [
    "All",
    ...new Set(
      data.projects.map(
        (x) => x.category
      )
    ),
  ];

  const projects =
    data.projects.filter(
      (x) =>
        filter === "All" ||
        x.category === filter
    );

  const headlines =
    p.headline.split("\n");


  return (
    <>
      <header className="nav">

        <a
          className="brand"
          aria-label={`${p.name}, home`}
          href="#home"
        >
          {p.name.split(" ")[0]}
          <span>.</span>
        </a>


        <nav
          aria-label="Main navigation"
          className={
            menu ? "open" : ""
          }
        >
          {[
            ["work", "Work"],
            ["about", "About"],
            ["experience", "Journey"],
            ["blog", "Writing"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <a
              href={`#${id}`}
              key={id}
              onClick={() =>
                setMenu(false)
              }
            >
              {label}
            </a>
          ))}
        </nav>


        <div className="nav-actions">

          <a
            className="button small"
            href="/Arish-Ahmad-Resume.pdf"
            download
          >
            <Download size={15} />
            Resume
          </a>


          <button
            className="icon menu-button"
            aria-label={
              menu
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={menu}
            onClick={() =>
              setMenu(!menu)
            }
          >
            {menu ? (
              <X />
            ) : (
              <Menu />
            )}
          </button>

        </div>
      </header>


      <main>

        {/* HERO SECTION */}

        <section
          id="home"
          className="hero wrap"
        >
          <div className="hero-content">

            <div className="eyebrow">

              <span className="tiny-line" />

              {p.eyebrow}

            </div>


            <h1>

              {headlines[0]}

              <br />

              <em>
                {headlines
                  .slice(1)
                  .join(" ")}
              </em>

            </h1>


            <p className="intro">
              {p.intro}
            </p>


            <div className="hero-actions">

              <a
                className="button mint"
                href="#work"
              >
                Explore my work
              </a>


              <a
                className="text-link"
                href="#contact"
              >
                Let’s talk
              </a>

            </div>

          </div>


          {/* STACK ART */}

          <div
            className="stack-art"
            aria-label="MERN stack: React interfaces, Express APIs, Node.js runtime, and MongoDB data"
          >

            <div className="orbit orbit-one" />

            <div className="orbit orbit-two" />


            <div className="stack-center">

              <Code2 size={34} />

              <span>
                MAKE IT WORK.
                <br />
                MAKE IT MATTER.
              </span>

            </div>


            <div className="stack-node react">

              <Braces size={21} />

              <div>

                <b>
                  React
                </b>

                <small>
                  THE INTERFACE
                </small>

              </div>

            </div>


            <div className="stack-node mongo">

              <Database size={20} />

              <div>

                <b>
                  MongoDB
                </b>

                <small>
                  THE DATA
                </small>

              </div>

            </div>


            <div className="stack-node node">

              <Code2 size={20} />

              <div>

                <b>
                  Node + Express
                </b>

                <small>
                  THE ENGINE
                </small>

              </div>

            </div>


            <span className="art-caption">
              IDEA / BUILD / ITERATE
            </span>

          </div>


          <div className="hero-foot">

            <span>
              {p.role.toUpperCase()}
            </span>


            <span>

              <MapPin size={13} />

              {p.location.toUpperCase()}

            </span>


            <a href="#work">
              SCROLL TO EXPLORE
            </a>

          </div>

        </section>


        {/* TECHNOLOGY STRIP */}

        <div
          className="stack-strip"
          aria-label="Primary technologies"
        >

          {[
            "REACT",
            "NODE.JS",
            "EXPRESS",
            "MONGODB",
            "JAVASCRIPT",
            "GIT",
          ].map((x) => (

            <span key={x}>

              {x}

              <i>
                ✳
              </i>

            </span>

          ))}

        </div>


        {/* WORK SECTION */}

        <section
          id="work"
          className="wrap section"
        >

          <div className="section-heading">

            <div>

              <div className="eyebrow">
                01 / SELECTED WORK
              </div>


              <h2>
                Ideas, brought to life
                <span>.</span>
              </h2>

            </div>


            <p>
              A few things I’ve built,
              <br />
              and what I learned along the way.
            </p>

          </div>


          <div
            className="filters"
            role="group"
            aria-label="Filter projects"
          >

            {filters.map((x) => (

              <button
                key={x}
                onClick={() =>
                  setFilter(x)
                }
                aria-pressed={
                  filter === x
                }
                className={
                  filter === x
                    ? "active"
                    : ""
                }
              >
                {x}
              </button>

            ))}

          </div>


          <div className="projects">

            {projects.map((pr) => (

              <article
                className="project"
                key={pr.id}
              >

                <button
                  className={`project-art art-${
                    data.projects.indexOf(
                      pr
                    ) % 3
                  }`}
                  onClick={() =>
                    setProject(pr)
                  }
                  aria-label={`Explore ${pr.title}`}
                >

                  <div className="art-top">

                    <span>
                      {pr.category}
                    </span>

                    <ExternalLink
                      size={18}
                    />

                  </div>


                  <b>

                    {String(
                      data.projects.indexOf(
                        pr
                      ) + 1
                    ).padStart(
                      2,
                      "0"
                    )}

                    <span>
                      /
                    </span>

                  </b>


                  <div className="art-bottom">

                    <span>
                      {pr.tags
                        .slice(0, 2)
                        .join(" + ")}
                    </span>

                    <Code2 size={23} />

                  </div>

                </button>


                <h3>

                  <button
                    className="title-button"
                    onClick={() =>
                      setProject(pr)
                    }
                  >
                    {pr.title}
                  </button>

                </h3>


                <p>
                  {pr.summary}
                </p>


                <div className="tags">

                  {pr.tags.map((t) => (

                    <span key={t}>
                      {t}
                    </span>

                  ))}

                </div>


                <button
                  className="project-link"
                  onClick={() =>
                    setProject(pr)
                  }
                >
                  Behind the project

                  <span>
                    +
                  </span>

                </button>

              </article>

            ))}

          </div>


          {projects.length === 0 && (

            <p>
              No projects in this category yet.
            </p>

          )}

        </section>


        {/* ABOUT SECTION */}

        <section
          id="about"
          className="wrap section about"
        >

          <div>

            <div className="eyebrow">
              02 / A LITTLE ABOUT ME
            </div>


            <h2>
              Curious by nature.
              <br />
              <em>
                Developer by practice.
              </em>
            </h2>


            <p className="body-copy">
              {p.about}
            </p>


            <div className="coding-links">

              {data.coding.map((c) => (

                <External
                  key={c.label}
                  href={c.url}
                >

                  {c.label}

                  <ExternalLink
                    size={13}
                  />

                </External>

              ))}

            </div>

          </div>


          <div className="education-card">

            <div className="education-top">

              <span>
                ALWAYS LEARNING
              </span>

              <BookOpen size={22} />

            </div>


            <div className="edu-number">

              {p.graduation}

              <span>
                EXPECTED GRADUATION
              </span>

            </div>


            <h3>
              {p.education}
            </h3>


            <p>
              {p.university}
            </p>


            <div className="edu-bottom">

              <span>
                CGPA
              </span>

              <strong>
                {p.cgpa}
              </strong>

            </div>

          </div>

        </section>


        {/* SKILLS SECTION */}

        <section
          id="skills"
          className="wrap section"
        >

          <div className="eyebrow">
            03 / MY TOOLKIT
          </div>


          <h2>
            The pieces behind the product.
          </h2>


          <div className="skills-grid">

            {data.skills.map(
              (s, i) => (

                <article
                  key={s.title}
                >

                  <span className="skill-number">
                    0{i + 1}
                  </span>


                  <h3>
                    {s.title}
                  </h3>


                  <div className="skill-list">

                    {s.items.map(
                      (t) => (

                        <span key={t}>
                          {t}
                        </span>

                      )
                    )}

                  </div>

                </article>

              )
            )}

          </div>

        </section>


        {/* EXPERIENCE SECTION */}

        <section
          id="experience"
          className="wrap section"
        >

          <div className="section-heading">

            <div>

              <div className="eyebrow">
                04 / BEYOND THE CODE
              </div>


              <h2>
                Learning. Contributing. Growing.
              </h2>

            </div>

          </div>


          <div className="journey-grid">

            <div>

              <h3 className="column-label">
                Community & leadership
              </h3>


              {data.experience.map(
                (e, i) => (

                  <article
                    className="journey"
                    key={i}
                  >

                    <span>
                      0{i + 1}
                    </span>


                    <div>

                      <h3>
                        {e.title}
                      </h3>


                      <h4>
                        {e.role}
                      </h4>


                      <p>
                        {e.description}
                      </p>

                    </div>

                  </article>

                )
              )}

            </div>


            <div>

              <h3 className="column-label">
                Training & certifications
              </h3>


              {data.certifications.map(
                (c, i) => (

                  <div
                    key={i}
                    className="cert"
                  >

                    <Check size={19} />

                    <p>
                      {c}
                    </p>

                  </div>

                )
              )}


              <div className="resume-note">

                <p>
                  The full story, in one page.
                </p>


                <a
                  className="button"
                  href="/Arish-Ahmad-Resume.pdf"
                  download
                >

                  <Download size={16} />

                  Download my resume

                </a>

              </div>

            </div>

          </div>

        </section>


        {/* BLOG SECTION */}

        <section
          id="blog"
          className="wrap section"
        >

          <div className="section-heading">

            <div>

              <div className="eyebrow">
                05 / THE DEVELOPER’S NOTEBOOK
              </div>


              <h2>
                Notes from the process.
              </h2>

            </div>

          </div>


          {data.posts.length ? (

            <div className="posts">

              {data.posts.map(
                (b) => (

                  <button
                    className="post-card"
                    key={b.id}
                    onClick={() =>
                      setPost(b)
                    }
                  >

                    <span>

                      {new Date(
                        b.date +
                          "T12:00:00"
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}

                    </span>


                    <h3>
                      {b.title}
                    </h3>


                    <p>
                      {b.excerpt}
                    </p>


                    <b>
                      Read note
                    </b>

                  </button>

                )
              )}

            </div>

          ) : (

            <div className="blog-empty">

              <BookOpen size={28} />


              <div>

                <h3>
                  A little space for what comes next.
                </h3>


                <p>
                  Project notes and things I learn along
                  the way will live here. No posts
                  published yet.
                </p>

              </div>


              <span>
                IN THE MAKING
              </span>

            </div>

          )}

        </section>


        {/* CONTACT SECTION */}

        <Contact
          profile={p}
          connected={connected}
        />

      </main>


      {/* FOOTER */}

      <footer className="wrap">

        <a
          className="brand"
          href="#home"
        >

          {p.name.split(" ")[0]}

          <span>
            .
          </span>

        </a>


        <p>
          © {new Date().getFullYear()}{" "}
          {p.name}. Built with curiosity.
        </p>


        <a href="/admin">
          Admin
        </a>

      </footer>


      {/* PROJECT MODAL */}

      {project && (

        <Modal
          title={project.title}
          onClose={() =>
            setProject(null)
          }
        >

          <div className="tags">

            {project.tags.map(
              (t) => (

                <span key={t}>
                  {t}
                </span>

              )
            )}

          </div>


          <p>
            {project.description}
          </p>


          <h3>
            My contributions
          </h3>


          <ul>

            {project.contributions.map(
              (t) => (

                <li key={t}>
                  {t}
                </li>

              )
            )}

          </ul>


          <div className="modal-links">

            <External
              className="button"
              href={project.github}
            >

              <Github size={16} />

              Source code

            </External>


            <External
              className="button mint"
              href={project.live}
            >
              Live project
            </External>

          </div>

        </Modal>

      )}


      {/* BLOG POST MODAL */}

      {post && (

        <Modal
          title={post.title}
          onClose={() =>
            setPost(null)
          }
        >

          <p className="muted">
            {post.date}
          </p>


          <div className="post-body">
            {post.body}
          </div>

        </Modal>

      )}

    </>
  );
}