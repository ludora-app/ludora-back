# Convention de nommage des migrations

- incrémenter le chiffre de 1
- Nom descriptif de la migration en anglais et en snake_case


## Attention !!

la commande "pnpm prisma migrate dev" DROP les indexes pg_trgm" car elle ne les voit dans aucun des schema.prisma. Il faut supprimer les lignes qui DROP les indexes pour éviter leur suppression