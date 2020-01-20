# Liturgy of the Hours

This a a digital liturgy of the hours. It is an attempt to help us mine the vast resources of prayers in the book of common prayer and elsewhere, and practice the patterns of prayer that Christians have practiced for millenia in a format that accounts for our habit of checking our phones too often.

The project is live [here](https://prayer.infopanel.org), and you can get reminders throughout the day by following [@ctpbot](https://twitter.com/ctpbot) on twitter.

## Features

* 7 sets of 3-5 minute daily prayers every day
* prayers are pseudo-randomly generated so they're always different (but same for each person who views the same office)
* there's currently a database of 300+ prayers, so there's usually something new
* Daily calls to prayer from a twitter bot
* Seasonal color changes
* Indicator dots that indicate how many people have accessed these prayers lately
* offline cache via service worker

## Details

* Depends on the Revised Common Lectionary
* Offices are generated in advance into static html using [eleventy](https://www.11ty.dev/)
* Access to bible text is through the [ESV API](https://api.esv.org/v3/docs/) v3, which is fantastic.

## Formatting

For the most part, text is markdown formatted, but I've made some special custom notations for formatting that comes up a lot in these sorts of prayers

```
>   Indented Line
>*  Indented Italic Line
>** Indented Bold Line
```

## To Do
* multiple time zone support, right now anyone more than an hour off of CST is SOL.
* implement localized/occasional prayers/of the people
* animations?
* browser push notifications (which don't work in mobile safari)
* native app - because of aforesaid Safari limitation
* websocket based live interactive features

## Disclaimer

This is very much a work in progress, both philosophically and technologically. Comments and suggestions very welcome: root at/@ infopanel.org or @ctpbot.
