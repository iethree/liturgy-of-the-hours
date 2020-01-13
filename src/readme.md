# Liturgy of the Hours

This a a digital liturgy of the hours. It is an attempt to help us mine the vast resources of prayers in the book of common prayer and elsewhere, and practice the patterns of prayer that Christians have practiced for millenia in a format that accounts for our habit of checking our phones too often.

The project is live [here](https://prayer.infopanel.org), and you can get reminders throughout the day by following [@ctpbot](https://twitter.com/ctpbot) on twitter.

## Features

* 7 sets of 3-5 minute daily prayers every day
* prayers are pseudo-randomly generated so they're always different
* there's currently a database nearly 500 prayers, so there's usually something new
* Daily calls to prayer from a twitter bot
* Seasonal color changes
* Little indicator dots that indicate how many people have accessed these prayers lately
* offline cache

## Hidden Features
* view and tag parts at /list

## Details
* Data is stored in nedb
* scriptures are also cached the first time they're accessed so I don't unnecessarily call the ESV API too much, also for speed.
* access to bible text is through the [ESV API](https://api.esv.org/v3/docs/) v3, which is fantastic.
* using the [Bulma](https://bulma.io/) stylesheet, which is also fantastic.
* using the [jade/pug](https://pugjs.org/api/getting-started.html) template engine

## Formatting

For the most part, text is markdown formatted, but I've made some special custom notations for formatting that comes up a lot in liturgical prayers

```
>   Indented Line
>*  Indented Italic Line
>** Indented Bold Line
```

## To Do
* better logic for picking parts - need priority/fallback options
* better part tagging
* multiple time zone support
* implement localized/occasional prayers/of the people
* animations?
* proper PWA notifications and caching
* custom notification schedules
* native iOS app because safari doesn't allow PWA push notifications

## Disclaimer

This is very much a work in progress, both philosophically and technologically. Comments and suggestions very welcome: root at/@ infopanel.org or @ctpbot.