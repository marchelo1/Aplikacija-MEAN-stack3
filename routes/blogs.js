const User = require('../models/user'); // Uvoz User model sheme 
const Blog = require('../models/blog'); // Izvoz Blog Model Sheme
const jwt = require('jsonwebtoken'); // modul za kreiranje JWT
const config = require('../config/database'); // Import database configuration

module.exports = (router) => {

  /* ===============================================================
     KREIRANJE NOVOG BLOGA
  =============================================================== */
  router.post('/newBlog', (req, res) => {
    // Provera da li je naslov bloga obezbedjen
    if (!req.body.title) {
      res.json({ success: false, message: 'Blog title is required.' }); 
    } else {
      // // Provera da li je telo bloga obezbedjen
      if (!req.body.body) {
        res.json({ success: false, message: 'Blog body is required.' }); 
      } else {
        // // Provera da li je autor bloga obezbedjen
        if (!req.body.createdBy) {
          res.json({ success: false, message: 'Blog creator is required.' }); 
        } else {
          // Kreiranje blog objekta za ubacivanje u bazu podataka 
          const blog = new Blog({
            title: req.body.title, // Polje za naslov
            body: req.body.body, // Polje za telo
            createdBy: req.body.createdBy // Polje za autora
          });
          // Sacuvaj blog u bazu podataka
          blog.save((err) => {
            // Provera gresaka
            if (err) {
              if (err.errors) {
                if (err.errors.title) {
                  res.json({ success: false, message: err.errors.title.message }); 
                } else {
                  if (err.errors.body) {
                    res.json({ success: false, message: err.errors.body.message }); 
                  } else {
                    res.json({ success: false, message: err });
                  }
                }
              } else {
                res.json({ success: false, message: err }); 
              }
            } else {
              res.json({ success: true, message: 'Blog saved!' }); 
            }
          });
        }
      }
    }
  });

  /* ===============================================================
     PREUZIMANJE SVIH BLOGOVA
  =============================================================== */
  router.get('/allBlogs', (req, res) => {
    // Provera baza podataka za sve blog postove
    Blog.find({}, (err, blogs) => {
      // Provera gresaka
      if (err) {
        res.json({ success: false, message: err }); 
      } else {
        // Provera da li su blogovi pronadjeni u bazi
        if (!blogs) {
          res.json({ success: false, message: 'No blogs found.' }); 
        } else {
          res.json({ success: true, blogs: blogs }); 
        }
      }
    })
  });

  /* ===============================================================
     PREUZIMANJE JEDNOG BLOGA
       =============================================================== */
  router.get('/singleBlog/:id', (req, res) => {
    // Provera da li je id u trenutnim parametrima 
    if (!req.params.id) {
      res.json({ success: false, message: 'No blog ID was provided.' }); 
    } else {
      // Provera da li je blog id nadjen u bazi podataka 
      Blog.findOne({ _id: req.params.id }, (err, blog) => {
        // Provera da li je id validan ID 
        if (err) {
          res.json({ success: false, message: 'Not a valid blog id' }); 
        } else {
          // Provera da li je u blogu pronadjen id 
          if (!blog) {
            res.json({ success: false, message: 'Blog not found.' }); 
          } else {
            // Pronalazenje trenutnog korisnika kojie je prijavljen 
            User.findOne({ _id: req.decoded.userId }, (err, user) => {
              if (err) {
                res.json({ success: false, message: err }); 
              } else {
                // Provera da li je korisnicko ime pronadjeno u bazi
                if (!user) {
                  res.json({ success: false, message: 'Unable to authenticate user' }); 
                } else {
                  // Provera da li je korisnik koji je poslao zahtev za jedan blog onaj koji ga je kreirao
                  if (user.username !== blog.createdBy) {
                    res.json({ success: false, message: 'You are not authorized to edit this blog.' }); 
                  } else {
                    res.json({ success: true, blog: blog }); // Kada je uspesno 
                  }
                }
              }
            });
          }
        }
      });
    }
  });

  /* ===============================================================
     AZURIRANJE BLOG POSTA
  =============================================================== */
  router.put('/updateBlog', (req, res) => {
    // Provera da li je id obezbedjen
    if (!req.body._id) {
      res.json({ success: false, message: 'No blog id provided' }); 
    } else {
      // Provera da li id postoji u bazi 
      Blog.findOne({ _id: req.body._id }, (err, blog) => {
        // Provera da li je id validan ID
        if (err) {
          res.json({ success: false, message: 'Not a valid blog id' }); 
        } else {
          // Provera da li id pronadjen u bazi 
          if (!blog) {
            res.json({ success: false, message: 'Blog id was not found.' }); 
          } else {
            // Provera koji je to korisnik koji je poslao zahtev za azuriranje bloga 
            User.findOne({ _id: req.decoded.userId }, (err, user) => {
              if (err) {
                res.json({ success: false, message: err }); 
              } else {
                // Provera ako je korisnik pronadjen u bazi 
                if (!user) {
                  res.json({ success: false, message: 'Unable to authenticate user.' }); 
                } else {
                  // Provera da li je korisnik prijavljen u jednom zahtevu za azuriranje blog posta
                  if (user.username !== blog.createdBy) {
                    res.json({ success: false, message: 'You are not authorized to edit this blog post.' }); 
                  } else {
                    blog.title = req.body.title; // Cuvanje poslednjeg blog naslova 
                    blog.body = req.body.body; // Cuvanje poslednjeg tela u blogu 
                    blog.save((err) => {
                      if (err) {
                        if (err.errors) {
                          res.json({ success: false, message: 'Please ensure form is filled out properly' });
                        } else {
                          res.json({ success: false, message: err });
                        }
                      } else {
                        res.json({ success: true, message: 'Blog Updated!' }); 
                      }
                    });
                  }
                }
              }
            });
          }
        }
      });
    }
  });

  /* ===============================================================
     BRISANJE BLOG POSTA 
  =============================================================== */
  router.delete('/deleteBlog/:id', (req, res) => {
    // Provera da li je id obezbedjen u parametrima 
    if (!req.params.id) {
      res.json({ success: false, message: 'No id provided' }); 
    } else {
       // Provera da li id pronadjen u bazi 
      Blog.findOne({ _id: req.params.id }, (err, blog) => {
        // Check if error was found
        if (err) {
          res.json({ success: false, message: 'Invalid id' }); 
        } else {
          // Provera ako je korisnik pronadjen u bazi 
          if (!blog) {
            res.json({ success: false, messasge: 'Blog was not found' }); 
          } else {
            // Get info on user who is attempting to delete post
            User.findOne({ _id: req.decoded.userId }, (err, user) => {
              // Check if error was found
              if (err) {
                res.json({ success: false, message: err }); 
              } else {
                // Check if user's id was found in database
                if (!user) {
                  res.json({ success: false, message: 'Unable to authenticate user.' });
                } else {
                  // Provera da li korisnig pokusava da obrise blog, isti onaj korisnik koji je postavio blog
                  if (user.username !== blog.createdBy) {
                    res.json({ success: false, message: 'You are not authorized to delete this blog post' }); 
                  } else {
                    // Brisanje bloga iz baze podataka 
                    blog.remove((err) => {
                      if (err) {
                        res.json({ success: false, message: err });
                      } else {
                        res.json({ success: true, message: 'Blog deleted!' }); 
                      }
                    });
                  }
                }
              }
            });
          }
        }
      });
    }
  });

  
  /* ===============================================================
     KOMENTARI NA BLOG POST
  =============================================================== */
  router.post('/comment', (req, res) => {
    // Proveri ako se komentar nalazi u zahtevu za 
        if (!req.body.comment) {
      res.json({ success: false, message: 'No comment provided' }); 
    } else {
      // Proveri ako se id nalazi u zahtevu za body
      if (!req.body.id) {
        res.json({ success: false, message: 'No id was provided' }); 
      } else {
        // Koristi id da nadjes blog post u bazi 
        Blog.findOne({ _id: req.body.id }, (err, blog) => {
          // Provera gresaka
          if (err) {
            res.json({ success: false, message: 'Invalid blog id' }); 
          } else {
            // Provera ako se id poklapa sa id od bilo kojeg drugog blog posta u bazi 
            if (!blog) {
              res.json({ success: false, message: 'Blog not found.' }); 
            } else {
              // Preuzimanje podataka korisnika koji se ulogovao 
              User.findOne({ _id: req.decoded.userId }, (err, user) => {
                // Provera gresaka 
                if (err) {
                  res.json({ success: false, message: 'Something went wrong' }); 
                } else {
                  // Proveri da li je korisnik pronadjen u bazi 
                  if (!user) {
                    res.json({ success: false, message: 'User not found.' }); 
                  } else {
                    // Dodaj novi komentar u niz blog posta 
                    blog.comments.push({
                      comment: req.body.comment, //Polje za komentar
                      commentator: user.username // Osoba koja je komentarisala 
                    });
                    // Sacuvaj blog post
                    blog.save((err) => {
                      // Provera da li ima gresaka 
                      if (err) {
                        res.json({ success: false, message: 'Something went wrong.' }); 
                      } else {
                        res.json({ success: true, message: 'Comment saved' }); 
                      }
                    });
                  }
                }
              });
            }
          }
        });
      }
    }
  });

  return router;
};
