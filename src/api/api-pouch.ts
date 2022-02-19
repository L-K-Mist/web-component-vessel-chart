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
    .map((item: any) => ({
      ...item,
      doc: undefined,
    }));
  const sortedByOldest = data.sort((a: any, b: any): number => {
    if (!a || !b) {
      return 0;
    }
    return b.firstFetched - a.firstFetched;
  });

  console.log("dvdb - data - data", data);
  console.log("dvdb - getAll - sortedByOldest", sortedByOldest);
  const oldest = sortedByOldest[0].firstFetched;
  const youngest = sortedByOldest[sortedByOldest.length - 1].firstFetched;
  const firstMinusLast = oldest - youngest;
  console.log("dvdb - getAll - firstMinusLast", firstMinusLast); // Returns negative number -230980
  const deleteFrontHalfOfArray = sortedByOldest.filter(
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
export function putTile(
  tileDoc: Record<string, unknown>,
  extraInfo: Record<string, unknown>
): void {
  const newDoc = {
    ...tileDoc,
    ...extraInfo,
  };
  let count: number | null = null;
  tileIndex.upsert(newDoc.id, function (doc: any) {
    if (!doc.count) {
      count = 1;
    }
    count !== null && count++;
    return {
      doc,
      count,
      ...newDoc,
    };
  });
}
