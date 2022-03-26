import PouchDB from "pouchdb-browser";
import PouchUpsert from "pouchdb-upsert";
PouchDB.plugin(PouchUpsert);
// PouchDB.debug.enable("*");
const tileIndex = new PouchDB("tile-index");

tileIndex.info().then(function (info: unknown) {
  console.log(info);
});

export async function destroy(): Promise<boolean> {
  return await tileIndex.destroy();
}

export async function getAll(): Promise<void> {
  const response = await tileIndex.allDocs({ include_docs: true });
  console.log("dvdb - getAll - response", response);
  const data = response.rows
    .map(({ doc }: any, index: number) => ({
      ...{ ...doc },
      sequenceId: index,
    }))
    .map((item: any) => {
      // destructured doc key deleted
      // ie this is the doc now, it doesn't need a doc key.
      delete item.doc;
      item.firstFetched = new Date(item.firstFetched).toUTCString();
      item.lastUsed = new Date(item.lastUsed).toUTCString();
      return item;
    });
  const sortedYoungestFirst = data.sort((a: any, b: any): number => {
    return b.firstFetched - a.firstFetched;
  });

  const sortedPopularFirst = data.sort((a: any, b: any): number => {
    return b.count - a.count;
  });
  console.log(
    "dvdb - sortedPopularFirst - sortedPopularFirst",
    sortedPopularFirst
  );

  console.log("dvdb - data - data", data);
  console.log("dvdb - getAll - sortedYoungestFirst", sortedYoungestFirst);
  const oldest = sortedYoungestFirst.length
    ? new Date(sortedYoungestFirst[0].firstFetched)?.getTime()
    : 0;
  const youngest = sortedYoungestFirst.length
    ? new Date(
        sortedYoungestFirst[sortedYoungestFirst.length - 1].firstFetched
      )?.getTime()
    : 0;
  const firstMinusLast = oldest - youngest;
  console.log("dvdb - getAll - youngest", youngest);
  console.log("dvdb - getAll - oldest", oldest);
  console.log("dvdb - getAll - firstMinusLast", firstMinusLast); // Returns negative number -230980
  if (isNaN(firstMinusLast)) {
    console.log("dvdb - getAll - Damn I'm NaN");
    // debugger;
  }
  const deleteFrontHalfOfArray = sortedYoungestFirst.filter(
    (_: unknown, index: number, array: number[]) => index > array.length / 2
  );
  console.log("dvdb - getAll - deleteFrontHalfOfArray", deleteFrontHalfOfArray);
}
// 1645298916124 - 1645301373131
// 1645293015978 - 1645293015978 =
// Meaning the first entry is the oldest, makes sense, increasing index.

// TODO  Main use our index - index being the fields we want to
// lightly be able to filter, map, or reduce.
// We filter or sort or reduce the index,
// getting a list of id's to fetch.
// Goal, a first Algorithm: GarbageCollector,
// When we're a safe distance from full storage, say 2/3 way there,
// We delete the 1/3 of the tiles, that were the longest since seen,
// Of the remaining 2/3 we cut in half based on the least number of timestamp
// The number of times it was fetched

// NICE to have: say we've recorded a set of tiles, areas of the map
// the user has been visiting often lately.
// think of a user-activity heatmap overlaid on the map,
// We know he's interested in that geography,
// So we can offer to download the timeline for those tiles.
// That's a matter of running through the tiles we have, knowing how to parse
// out the date for those layers like weather that are date-driven.
// create a queue of tile-urls that are identical except for date,
// and preload those busy places across the timeline.
// Then you pre-cache those endpoints, for when they're needed.

// Alert: "Maybe grab a cuppa, this might take a few minutes."
// Progress-Loader.
// For faster data.

export function putTile(
  tileDoc: Record<string, unknown>,
  extraInfo: Record<string, unknown>
): void {
  const newDoc = {
    ...tileDoc,
    ...extraInfo,
  };
  tileIndex.upsert(newDoc.id, function (doc: any) {
    if (!doc.count) {
      doc.count = 1;
    }
    doc.count += 1;
    return {
      ...doc,
      ...newDoc,
    };
  });
}
