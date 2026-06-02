Après avoir lancer la commande

```typescript
pnpm outdated
```
et consulter le dependabot du repo j'ai obtenu ces résultats:
![pnpm outdated](pnpm-outdated.png)
![Dependabot](dependabot.png)

Plus de 100 packages sont obsolètes, avec des failles de sécurité critiques.
Dependabot nous donne des solutions pour mettre à jour ces packages, et nous indique les versions fixées.

![version-fix](version-upgrade.png)

Ainsi qu'une description apronfondie du problème:

![description](description.png)
![sevirity](sevirity.png)

Après avoir lancé

```typescript
pnpm upgrade
````
La majorité des packages ont été mis à jour, mais il reste encore quelques vulnérabilités, heureusement qu'il s'agit de failles de sécurité modérées. 

![pnpm upgrade](package-json-upgrade.png)

Et les tests passent toujours

![tests](tests.png)
