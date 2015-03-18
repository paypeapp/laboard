# Laboard

This project is a fork of [laboard](https://gitlab.com/laboard/laboard). For documentation and installation
visit the original project. This one does not aspire to become a pull request or be compatible with the original. 
It just has changes that one team needs to manage their board.

## Deviations from original laboard

* All issues from every namespace/project on one board
* Issues pulled from postgre db bypassing the API layer (needed for the first and most important feature)
* Only non-closed issues on board
* Ordering of issues
* Docker running gulp