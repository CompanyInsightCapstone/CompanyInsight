import "../styles/Item.css";

export default function CompanyItem({ company }) {
  return (
    <article className="list-item">
      <h2 className="list-item-header">{company.name} </h2>
      <h3 className="list-item-symbol">{company.symbol}</h3>
      <p className="list-item-typography">{company.exchange}</p>
      <p className="list-item-typography">{company.assetType}</p>
      <p className="list-item-typography">{company.ipoDate}</p>
      <p className="list-item-typography">{company.exchange}</p>
      <p className="list-item-typography">{company.status}</p>
    </article>
  );
}
